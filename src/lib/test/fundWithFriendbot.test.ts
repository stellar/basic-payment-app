import { describe, it, expect, vi } from 'vitest'
import { fundWithFriendbot, server } from '../stellar/horizonQueries'

describe('fundWithFriendbot', () => {
    it('should call friendbot to fund the account with the given public key', async () => {
        const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB'

        const callMock = vi.fn().mockResolvedValue(true)

        // We only need the `call()` method of friendbot's call builder
        const friendbotMock = vi
            .spyOn(server, 'friendbot')
            .mockReturnValue({ call: callMock } as unknown as ReturnType<typeof server.friendbot>)

        await fundWithFriendbot(publicKey)

        expect(friendbotMock).toHaveBeenCalledWith(publicKey)

        expect(callMock).toHaveBeenCalled()

        friendbotMock.mockRestore()
    })
})
