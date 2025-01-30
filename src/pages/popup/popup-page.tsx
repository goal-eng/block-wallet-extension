import React, { JSX, useState } from 'react';

import logo from '@common/assets/logo.svg';
import { config } from '@common/config';

const Switcher = () => {
  const [isChecked, setIsChecked] = useState(false)

  const handleCheckboxChange = () => {
    console.log(isChecked);
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

export function PopupPage(): JSX.Element {
  return (
    <div className="wrapper bg-bodydark text-whiten">
      <div className='flex py-3 px-6 items-center border-b-2 border-gray'>
        <p className='text-whiten grow ml-2 text-2xl text-left text-gray'>AIVA</p>
        <a
          href="javascript:;"
          className="bg-primary dark:bg-primary border-none border rounded-md inline-flex items-center justify-center py-2 px-4 text-center text-base font-medium text-white hover:bg-body-color hover:border-body-color disabled:bg-gray-3 disabled:border-gray-3 disabled:text-dark-5"
          >
          Connected: 0x823...2d
        </a>
      </div>
      <div className="m-4 py-4 px-6 bg-bodydark1 border-none rounded-md">
        <div className='flex items-center m-2'>
          <p className='grow  text-left'>Top 10 Holders</p>
          <Switcher />
        </div>
        <div className='flex items-center m-2'>
          <p className='grow  text-left'>Bundle Percentage</p>
          <Switcher />
        </div>
      </div>
    </div>
  );
}
