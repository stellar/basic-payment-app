import { error } from '@sveltejs/kit'

/**
 * Compares a submitted pincode to make sure it is valid for the stored, encrypted keypair.
 * @param {Object} opts - Options object
 * @param {string} opts.pincode - Pincode being confirmed against existing stored wallet
 * @param {string} [opts.firstPincode] - On signup, the pincode that is being matched against
 * @param {boolean} [opts.signup=false] - Whether or not the confirmation is for the initial signup
 * @throws - Will throw an error if the signup pincodes don't match, or if the provided pincode doesn't decrypt the keypair.
 */
export const confirmCorrectPincode = ({ pincode, firstPincode = '', signup = false }) => {
    if (signup) {
        if (pincode !== firstPincode) {
            throw error(400, { message: 'pincode mismatch' })
        }
    } else {
        throw error(400, 'only signups now')
    }
}
