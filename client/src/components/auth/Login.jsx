import React, { useRef, useState } from "react";
import { loginStyles } from "./styles";
import { authApi } from "../../api/modules/auth";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { saveUser } from "../../store/functions/user";
import { setLoading } from "../../store/functions/ux";
import { GoogleLogin } from "@react-oauth/google";

const Login = ({ setAuthState, setMessages }) => {
  /* Login comp here */

  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  //Navbar
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // LOGIN FUNCTION
  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = {
      phone: phoneRef.current.value,
      password: passwordRef.current.value,
    };
    try {
      dispatch(setLoading(true));
      const res = await authApi.login(auth);
      console.log(res);
      setMessages({ successMsg: res.message });
      dispatch(saveUser(res.data));
      navigate("/");
      // window.location.reload();
    } catch (error) {
      navigate("/login");
      console.log(error);
      setMessages({ errorMsg: error.message });
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className={loginStyles.container}>
      <h3 className={loginStyles.heading}>{loginStyles.headingText} </h3>
      <form className={loginStyles.form} onSubmit={handleLogin}>
        <input
          id="phone"
          className={loginStyles.input}
          type="text"
          ref={phoneRef}
          required
          placeholder="phone eg: 9876543210"
        ></input>
        <input
          required
          id="password"
          name="current-password"
          className={loginStyles.input}
          type="password"
          ref={passwordRef}
          placeholder="password"
        ></input>
        <button type="submit" className={loginStyles.button}>
          Login
        </button>
        {/* <div className="flex flex-col gap-4">
          OR
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={handleGoogleError}
          />
        </div> */}
        <p>
          Not a user?{" "}
          <span
            className="text-blue-400 underline"
            onClick={() => setAuthState({ login: false })}
          >
            Sign up
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
