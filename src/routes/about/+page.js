import { Server, Keypair } from 'stellar-sdk'

/** @type {import ('./$types').PageLoad} */
export async function load() {
    const server = new Server('https://horizon-testnet.stellar.org')
    const { records } = await server.assets().limit(200).order('desc').call()
    const kp = Keypair.random()

    return {
        num_records: records.length,
        most_recent: {
            code: records[0].asset_code,
            issuer: records[0].asset_issuer,
        },
        random_public_key: kp.publicKey(),
    }
}
