"use client"
import Loader from "@/component/loader/Loader";

const DashBoard = () => {
  return (
    <div className="flex">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to the dashboard!</p>
        <Loader isLoading fullscreen/>
      </div>
    </div>
  );
};
export default DashBoard;