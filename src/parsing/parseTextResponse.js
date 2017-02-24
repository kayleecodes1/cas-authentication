import CasResponseError from '../errors/CasResponseError';
import CasAuthenticationError from '../errors/CasAuthenticationError';

function parseTextResponse(body) {
    return new Promise((resolve, reject) => {

        const lines = body.split('\n');

        const failure = lines[0] === 'no';
        if (failure) {
            reject(new CasAuthenticationError('Ticket validation failure.'));
            return;
        }

        const success = lines[0] === 'yes';
        const user = lines[1];
        if (!success || !user) {
            reject(new CasResponseError('Invalid response from CAS server.'));
            return;
        }

        const attributes = null;

        resolve({ user, attributes });
    });
}

export default parseTextResponse;
