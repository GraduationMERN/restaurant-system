import { Routes } from "react-router"
export default function LandingPage() {
  return (
    <div className="h-[100vh] flex flex-col justify-evenly items-center">
        <h1 className="text-6xl text-pink-600">Welcome to Restaurant</h1>
        <div className="flex flex-col text-3xl justify-around h-1/3">
            <a href=''>Menu</a>
            <a href=''>Review</a>
            <a href=''>Menu</a>
            <a href=''>Review</a>
        </div>
    </div>
  )
}
