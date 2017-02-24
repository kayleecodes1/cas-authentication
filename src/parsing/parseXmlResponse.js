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

function parseXmlResponse(body) {
    return new Promise((resolve, reject) => {

        parseXml(body, XML_OPTIONS, (err, result) => {

            if (err) {
                reject(new CasResponseError(`Invalid response from CAS server. (${err})`));
                return;
            }

            const serviceResponse = props.get(result, 'serviceResponse');
            if (!serviceResponse) {
                reject(new CasResponseError('Invalid response from CAS server. Missing serviceResponse tag.'));
                return;
            }

            const failure = serviceResponse.authenticationFailure;
            if (failure) {
                const code = failure.$.code;
                const message = failure._;
                reject(new CasAuthenticationError(`Ticket validation failure. (${code}: ${message})`));
                return;
            }

            const success = serviceResponse.authenticationSuccess;
            if (!success) {
                reject(new CasResponseError('Invalid response from CAS server. No valid status tag.'));
                return;
            }

            const user = success.user;
            if (!user) {
                reject(new CasResponseError('Invalid response from CAS server. No valid user tag.'));
                return;
            }

            // Attributes are only present in CAS 3.0 (not 2.0).
            let attributes = null;
            const xmlAttributes = success.attributes;
            if (xmlAttributes) {
                attributes = {};
                for (const key of Object.keys(xmlAttributes)) {
                    const value = xmlAttributes[key];
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

export default parseXmlResponse;
