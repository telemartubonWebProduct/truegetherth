import React from "react";

interface EntertainmentIcoProps {
  color?: string; // สีของไอคอน (ค่าเริ่มต้นเป็น black)
  size?: number; // ขนาดของไอคอน (ค่าเริ่มต้นเป็น 50)
}

const EntertainmentIco: React.FC<EntertainmentIcoProps> = ({ color = "black", size = 50 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 93 80"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color }} // ใช้สีผ่าน style
  >
    <path
      style={{ fill: "currentColor" }}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.45 17.6152H80.0079V55.7032H13.45V17.6152ZM16.814 20.7412H76.67V52.5712H16.814V20.7412Z"
    />
    <path
      style={{ fill: "currentColor" }}
      d="M58.767 59.4351H34.689V61.7871H58.767V59.4351Z"
    />
    <path
      style={{ fill: "currentColor" }}
      d="M48.5402 55.7031H44.9163V59.8371H48.5402V55.7031Z"
    />
  </svg>
);

export default EntertainmentIco;
