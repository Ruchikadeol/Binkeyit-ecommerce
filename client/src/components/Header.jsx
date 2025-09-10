import React from "react";
import logo from "../assets/logo.png";

const Header = () => {
  return (
    <header className="h-20 shadow-md flex items-center px-4">
      {/* <h1 className="text-xl font-bold">Binkeyit</h1> */}
      {/** Logo */}
      <div>
        <div className="h-full flex justify-center items-center">
          <img src={logo} alt="Binkeyit Logo" width={170} height={60} />
        </div>
      </div>
      {/** Search Bar */}
      {/** Login and my cart */}
    </header>
  );
};

export default Header;
