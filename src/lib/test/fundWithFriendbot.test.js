import { describe, it, expect, vi } from 'vitest';
import { fundWithFriendbot, server } from '../stellar/horizonQueries';

describe('fundWithFriendbot', () => {
    it('should call friendbot to fund the account with the given public key', async () => {
      const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';

      const callMock = vi.fn().mockResolvedValue(true);
  
      const friendbotMock = vi
        .spyOn(server, 'friendbot')
        .mockReturnValue({
            call: callMock,
            // @ts-ignore
            url: undefined,
            filter: [],
            originalSegments: [],
            neighborRoot: '',
            stream: function (options) {
                throw new Error('Function not implemented.');
            },
            cursor: function (cursor) {
                throw new Error('Function not implemented.');
            },
            limit: function (recordsNumber) {
                throw new Error('Function not implemented.');
            },
            order: function (direction) {
                throw new Error('Function not implemented.');
            },
            join: function (include) {
                throw new Error('Function not implemented.');
            },
            forEndpoint: function (endpoint, param) {
                throw new Error('Function not implemented.');
            },
            checkFilter: undefined,
            _requestFnForLink: undefined,
            _parseRecord: undefined,
            _sendNormalRequest: undefined,
            _parseResponse: undefined,
            _toCollectionPage: undefined,
            _handleNetworkError: undefined
        });
  
      await fundWithFriendbot(publicKey);
  
      expect(friendbotMock).toHaveBeenCalledWith(publicKey);
  
      expect(callMock).toHaveBeenCalled();
  
      friendbotMock.mockRestore();
    });
  });
  