import { parseString as parseXml } from 'xml2js';
import XMLprocessors from 'xml2js/lib/processors';
import props from 'deep-property';

import CasResponseError from '../errors/CasResponseError';
import CasAuthenticationError from '../errors/CasAuthenticationError';

const XML_OPTIONS = {
    trim: true,
    normalize: true,
    explicitArray: false,
    tagNameProcessors: [XMLprocessors.stripPrefix]
};

const STATUS_CODE_REGEX = /^.*:(.*)$/;
function extractStatusCode(string) {
    return string.match(STATUS_CODE_REGEX)[1];
}

function parseSamlResponse(body) {
    return new Promise((resolve, reject) => {

        parseXml(body, XML_OPTIONS, (err, result) => {

            if (err) {
                reject(new CasResponseError(`Invalid response from CAS server. (${err})`));
                return;
            }

            const response = props.get(result, 'Envelope.Body.Response');

            const statusCode = props.get(response, 'Status.StatusCode');
            if (!statusCode) {
                reject(new CasResponseError('Invalid response from CAS server. No valid StatusCode tag.'));
                return;
            }

            let allStatusCodes;
            if (statusCode.constructor === Array) {
                allStatusCodes = statusCode
                    .map((a) => extractStatusCode(props.get(a, '$.Value')))
                    .filter((a) => a);
            }
            else {
                allStatusCodes = [extractStatusCode(props.get(statusCode, '$.Value'))];
            }
            if (allStatusCodes[0] !== 'Success') {
                reject(new CasAuthenticationError(`Ticket validation failure. (${allStatusCodes.join(', ')}`));
                return;
            }

            const user = props.get(response, 'Assertion.AuthenticationStatement.Subject.NameIdentifier');
            if (!user) {
                reject(new CasResponseError('Invalid response from CAS server. No valid NameIdentifier tag.'));
                return;
            }

            let attributes = null;
            let samlAttributes = props.get(response, 'Assertion.AttributeStatement.Attribute');
            if (samlAttributes) {
                attributes = {};
                if (samlAttributes.constructor !== Array) {
                    samlAttributes = [samlAttributes];
                }
                for (const tag of samlAttributes) {
                    const key = props.get(tag, '$.AttributeName');
                    const value = tag.AttributeValue;
                    if (!key || !value) {
                        continue;
                    }
                    if (typeof value === 'string') {
                        attributes[key] = value;
                        continue;
                    }
                    if (value.constructor === Object) {
                        attributes[key] = value._;
                        continue;
                    }
                    if (value.constructor === Array) {
                        attributes[key] = value.map((a) => a.constructor === Object ? a._ : a);
                    }
                }
            }

            resolve({ user, attributes });
        });
    });
}

export default parseSamlResponse;
