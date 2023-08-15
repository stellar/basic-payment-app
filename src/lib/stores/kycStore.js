import { persisted } from 'svelte-local-storage-store'

/**
 * @module $lib/stores/kycStore
 * @description A Svelte store that can hold all the standard SEP-9 KYC fields
 * in the browser's localStorage. This is useful during SEP-6 transfers, so we
 * don't need to ask the user multiple times for the same information.
 * @see {@link https://stellar.org/protocol/sep-9}
 */

/** @type {import('svelte/store').Writable<Object.<string, string>>} */
export const kycStore = persisted('bpa:kycStore', {
    last_name: '',
    first_name: '',
    additional_name: '',
    address_country_code: '',
    state_or_province: '',
    city: '',
    postal_code: '',
    address: '',
    mobile_number: '',
    email_address: '',
    birth_date: '',
    birth_place: '',
    birth_country_code: '',
    bank_account_number: '',
    bank_account_type: '',
    bank_number: '',
    bank_phone_number: '',
    bank_branch_number: '',
    clabe_number: '',
    tax_id: '',
    tax_id_name: '',
    occupation: '',
    employer_name: '',
    employer_address: '',
    language_code: '',
    id_type: '',
    id_country_code: '',
    id_issue_date: '',
    id_expiration_date: '',
    id_number: '',
    photo_id_front: '',
    photo_id_back: '',
    notary_approval_of_photo_id: '',
    ip_address: '',
    photo_proof_residence: '',
    sex: '',
    proof_of_income: '',
    proof_of_liveness: '',
    cbu_number: '',
    cbu_alias: '',
})
