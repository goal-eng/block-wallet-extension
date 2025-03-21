import React, { JSX, useEffect, useState } from 'react';

import logo from '@common/assets/logo.png';
import { config } from '@common/config';
import { hostPermissions } from '@src/manifest/build-manifest';
import { parseLamports, checkTabs, formatDecimals, getRemainingTimeString } from '@src/utils';
import moment from 'moment';
import { ICON_PHANTOM, ICON_SOLFLARE } from '@src/common/solana/wallet/utils';

const Switcher = () => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = () => {
    // console.log(isChecked);
    setIsChecked(!isChecked)
  }

  return (
    <>
      <label className='flex cursor-pointer select-none items-center'>
        <div className='relative'>
          <input
            type='checkbox'
            checked={isChecked}
            onChange={handleCheckboxChange}
            className='peer sr-only'
          />
          <div className='block h-8 rounded-full box bg-red dark:bg-red w-14 peer-checked:bg-secondary opacity-60'></div>
          <div className='absolute w-6 h-6 transition bg-red rounded-full dot dark:bg-red left-1 top-1 peer-checked:translate-x-full peer-checked:bg-secondary'></div>
        </div>
      </label>
    </>
  )
}

const BLOCK_FEE_LAMPORTS: number = 50000000; // 0.05 SOL
const UNBLOCK_FEE_LAMPORTS: number = 250000000;

export function PopupPage(): JSX.Element {
  const [address, setAddress] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [blockInterval, setBlockInterval] = useState<number>(24);
  const [blockExpiry, setBlockExpiry] = useState<number>(0);
  const [blockRemaining, setBlockRemaining] = useState<number>(0);
  const [blockState, setBlockState] = useState<'blocked' | 'unblocked' | 'pending' | 'blocking' | 'unblocking'>('pending');
  const [balance, setBalance] = useState<number>(0);
  const [walletType, setWalletType] = useState<'phantom' | 'solflare' | null>(null);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);
  const [solPrice, setSolPrice] = useState<number>(-1);

  useEffect(() => {
    // chrome.tabs.query({ active: true }, (tabs: any) => {
    //   setIsAvailable(checkTabs(tabs));
    // });
    fetch(`https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112`)
    .then((response) => response.json())
    .then((data) => {
      setSolPrice(data?.data['So11111111111111111111111111111111111111112']?.price);
    })
    .catch((error) => {
      setSolPrice(-1);
      // console.error(error);
    });

    const updateWalletAddress = (message: any) => {
      // console.log("Popup Message", message);
      if (message.type === "UPDATE_WALLET_ADDRESS") {
        const expiry = message.expiry || 0;
        setBlockRemaining(0);
        setBlockState(expiry ? 'pending' : 'unblocked');
        setAddress(message.address || '');
        setBlockExpiry(expiry);
        setBalance(message.balance || 0);
        setIsLoading(false);
        setLastUpdateTimestamp(new Date().getTime());
      }
      else if (message.type === "UPDATE_WALLET_STATE") {
        if (message.code == 0) {
          chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "REQUEST_WALLET_ADDRESS" }).then((response) => {}).catch((error) => {});
        }else {
          setIsLoading(false);
        }
      }
    };
    chrome.runtime.onMessage.addListener(updateWalletAddress);
    chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "REQUEST_WALLET_TYPE" }).then((response) => {
      // console.log("REQUEST_WALLET_TYPE", response);
      if (!response.success) return;
      handleWalletButton(response.wallet || 'phantom');
    }).catch((error) => {});
    return () => {
      chrome.runtime.onMessage.removeListener(updateWalletAddress)
    }
  }, []);

  const handleWalletButton = (type: 'phantom' | 'solflare') => {
    setWalletType(type);
    chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "UPDATE_WALLET_TYPE", wallet: type }).then((response) => {
      chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "REQUEST_WALLET_ADDRESS" }).then((response) => {}).catch((error) => {});
    }).catch((error) => {});
  }

  useEffect(() => {
    // console.log("Block Expiry Changed", blockExpiry);
    if (isLoading) return;
    const interval = setInterval(() => {
      if (blockExpiry > new Date().getTime()) {
        setBlockRemaining(blockExpiry - new Date().getTime());
        setBlockState('blocked');
      }else if (interval) {
        setBlockRemaining(0);
        clearInterval(interval);
        setBlockState('unblocked');
      }
    }, 1000);
    return () => {
      interval && clearInterval(interval);
    };
  }, [isLoading, blockExpiry, lastUpdateTimestamp]);

  const handleConnect = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "CONNECT_WALLET" }).then((response) => {}).catch((error) => {});
  }

  const handleDisconnect = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "DISCONNECT_WALLET" }).then((response) => {}).catch((error) => {});
  }

  const handleBlockWallet = async () => {
    setIsLoading(true);
    setBlockState('blocking');
    chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "BLOCK_WALLET", data: {interval: blockInterval} }).then((response) => {}).catch((error) => {});
  }

  const handleUnblockWallet = async () => {
    setIsLoading(true);
    setBlockState('unblocking');
    chrome.runtime.sendMessage({ type: "SEND_TO_PAGE_BACKGROUND", message: "UNBLOCK_WALLET" }).then((response) => {}).catch((error) => {});
  }

  return (<>
    {
      <div className="wrapper bg-bodydark text-whiten relative">
        <div className='flex py-3 px-6 items-center border-b-2 border-gray'>
          <p className='flex items-center text-whiten grow text-xl text-left text-gray'>
            <img src={logo} alt="Logo" className="w-7 h-7 inline-block mr-2" />
            RugShield
          </p>
          <button style={{padding: '6px' }} className={`mr-2 border rounded-full ${walletType == 'phantom' ? 'border-primary' : 'border-graydark'}`} onClick={() => handleWalletButton('phantom')}>
            <img src={ICON_PHANTOM} alt="Logo" className="w-4 h-4 " />
          </button>
          <button style={{padding: '6px' }} className={`mr-2 border rounded-full ${walletType == 'solflare' ? 'border-primary' : 'border-graydark'}`} onClick={() => handleWalletButton('solflare')}>
            <img src={ICON_SOLFLARE} alt="Logo" className="w-4 h-4 " />
          </button>
          <button
            disabled={isLoading || !isAvailable}
            onClick={address ? handleDisconnect : handleConnect}
            className="button"
            >
              {
                address ? `${address.slice(0, 6)}...${address.slice(-6)}` : 'Connect Wallet'
              }
          </button>
        </div>
        <div className='p-4 space-y-4'>
          <div className={`p-4 bg-bodydark1 border-none rounded-md ${isAvailable ? '' : 'forbidden'}`}>
            <p className="text-gray-400 text-sm text-left">
            Shield your wallet from impulsive risks: lock it for just <b>0.05 SOL</b> to help keep you on track and avoid losses. 
            We're here to help, but you can always unlock your wallet for a discouraging fee of <b>0.25 SOL</b>.
            </p>
            <div className='flex items-center py-2'>
              <p className='text-left text-whiten'>Block Interval:</p>
              <div className='grow text-right'>
                <select 
                  className="py-2 px-4 rounded-md min-w-[180px] " 
                  value={blockInterval} 
                  onChange={(e) => setBlockInterval(parseInt(e.target.value))}
                  disabled={blockState !== 'unblocked' || balance < BLOCK_FEE_LAMPORTS || isLoading}>
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                  <option value="720">1 month</option>
                </select>
              </div>
            </div>
            <div className='flex items-center py-2'>
              <button className='w-full button' disabled={blockState !== 'unblocked' || balance < BLOCK_FEE_LAMPORTS || isLoading} onClick={handleBlockWallet}>Block Wallet</button>
            </div>
            <div className='flex items-center py-2'>
              <button className='w-full button-outline' disabled={blockState !== 'blocked' || balance < UNBLOCK_FEE_LAMPORTS || isLoading} onClick={handleUnblockWallet}>Unblock Wallet</button>
            </div>
          </div>
          <div className={`p-4 bg-bodydark1 border-none rounded-md ${isAvailable ? '' : 'forbidden'}`}>
            <div className='flex items-center py-2'>
              <p className='text-left text-whiten'>Blocked Status:</p>
              <p className='grow text-right text-white'>
                {
                  blockState == 'blocking' ? <span className="">Blocking</span>
                  : blockState == 'unblocking' ? <span className="">Unblocking</span>
                  : (blockState == 'pending' || isLoading) ? (
                    <span className="">Checking</span>
                  ) : 
                  blockExpiry > new Date().getTime() ? (
                    <span className="text-red font-semibold">Blocked</span>
                  ) : (
                    <span className="text-green font-semibold">Unblocked</span>
                  )
                }
              </p>
            </div>
            <div className='flex items-center py-2'>
              <p className='text-left text-whiten'>Blocked Time:</p>
              <p className='grow text-right text-white'>
              {
                !isLoading && blockState == 'blocked' && blockExpiry > new Date().getTime() ? (
                  <span className="">{moment(blockExpiry).format('YYYY-MM-DD HH:mm:ss')}</span>
                ) : (
                  <span className="">---</span>
                )
              }
              </p>
            </div>
            {
              !isLoading && blockState == 'blocked' && blockRemaining > 0 && <div className='flex items-center py-2'>
                <p className='text-left text-whiten'>Remaining:</p>
                <p className='grow text-right text-white'>
                  {
                    blockRemaining > 0 ? (
                        <span className="">{getRemainingTimeString(blockRemaining)}</span>
                    ) : 'Expired'
                  }
                </p>
              </div>
            }
            
            <div className='border border-b-1 border-bodydark my-2'></div>
            <div className='flex items-center py-2'>
              <p className='text-left text-whiten'>SOL Balance:</p>
              <p className='grow text-right text-white'>{ formatDecimals(parseLamports(balance)) } SOL</p>
            </div>
            <div className='flex items-center py-2'>
              <p className='text-left text-whiten'>USD Balance:</p>
              <p className='grow text-right text-white'>{ solPrice >= 0 && balance >= 0 ? formatDecimals(solPrice * parseLamports(balance)) + ' USD' : 'Calculating...' }</p>
            </div>
          </div>
        </div>
        <div className={`absolute w-full h-full left-0 top-0 pt-10 flex items-center justify-center ${isAvailable ? 'hidden' : ''}`}>
          <p className='text-whiten grow ml-2 text-2xl text-center text-gray'>Not Available on this page</p>
        </div>
      </div>
    }
    </>
  );
}
