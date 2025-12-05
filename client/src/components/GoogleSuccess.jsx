// GoogleSuccess.jsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { googleLogin } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";

export default function GoogleSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(googleLogin()).then(() => {
      navigate("/");
    });
  }, []);

  return <div>Logging you in...</div>;
}
