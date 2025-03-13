/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/block_wallet.json`.
 */
export type BlockWallet = {
    "address": "A77rXueYXYg3bJejEFRuQFv2bbV3sBhCZwotH4cy4HCX",
    "metadata": {
      "name": "blockWallet",
      "version": "0.1.0",
      "spec": "0.1.0",
      "description": "Created with Anchor"
    },
    "instructions": [
      {
        "name": "blockWallet",
        "discriminator": [
          132,
          75,
          123,
          1,
          97,
          186,
          159,
          194
        ],
        "accounts": [
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "wallet",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    119,
                    97,
                    108,
                    108,
                    101,
                    116
                  ]
                },
                {
                  "kind": "account",
                  "path": "user"
                }
              ]
            }
          },
          {
            "name": "feeAccount",
            "writable": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "blockDuration",
            "type": "i64"
          }
        ]
      },
      {
        "name": "getBlockStatus",
        "discriminator": [
          197,
          106,
          226,
          218,
          122,
          232,
          16,
          218
        ],
        "accounts": [
          {
            "name": "wallet",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    119,
                    97,
                    108,
                    108,
                    101,
                    116
                  ]
                },
                {
                  "kind": "account",
                  "path": "user"
                }
              ]
            }
          },
          {
            "name": "user",
            "signer": true
          }
        ],
        "args": [],
        "returns": "i64"
      },
      {
        "name": "initialize",
        "discriminator": [
          175,
          175,
          109,
          31,
          13,
          152,
          155,
          237
        ],
        "accounts": [
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "wallet",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    119,
                    97,
                    108,
                    108,
                    101,
                    116
                  ]
                },
                {
                  "kind": "account",
                  "path": "user"
                }
              ]
            }
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "feeAccount",
            "type": "pubkey"
          }
        ]
      },
      {
        "name": "unblockWallet",
        "discriminator": [
          123,
          52,
          119,
          61,
          139,
          43,
          126,
          73
        ],
        "accounts": [
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "wallet",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    119,
                    97,
                    108,
                    108,
                    101,
                    116
                  ]
                },
                {
                  "kind": "account",
                  "path": "user"
                }
              ]
            }
          },
          {
            "name": "feeAccount",
            "writable": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": []
      }
    ],
    "accounts": [
      {
        "name": "wallet",
        "discriminator": [
          24,
          89,
          59,
          139,
          81,
          154,
          232,
          95
        ]
      }
    ],
    "errors": [
      {
        "code": 6000,
        "name": "blockNotExpired",
        "msg": "Block duration has not yet expired"
      }
    ],
    "types": [
      {
        "name": "wallet",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "blockExpiry",
              "type": "i64"
            },
            {
              "name": "feeAccount",
              "type": "pubkey"
            }
          ]
        }
      }
    ]
};
  