import React from 'react'

export default function Navbar() {
  return (
    <div className='h-20 w-full flex justify-around items-center bg-gray-200'>
        <h1 className='text-3xl'>Restuarant</h1>

        <div className='flex gap-10 text-xl'>
            <a href=''>Home</a>
            <a href=''>Menu</a>
            <a href=''>Review</a>
            <a href=''>Contact</a>
        </div>
    </div>
  )
}
