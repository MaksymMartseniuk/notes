import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import GoogleLoginButton from "../components/GoogleAuth";
import useUser from "../hooks/useUser"

function Forms({ route, method }) {
    const [text, setText] = useState("Continue");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const { loadUser } = useUser();
    const navigate = useNavigate();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;

    useEffect(() => {
        if (!emailRegex.test(email)) {
            if (showPassword) {
                setError("Please enter a valid email address.");
            }
            setShowPassword(false);
            setText("Continue");
        } else {
            setError(null);
        }
    }, [email]);

    useEffect(() => {
        if (error && passwordRegex.test(password)) {
            setError(null);
        }
    }, [password]);

    const handleButtonClick = async (e) => {
        e.preventDefault();

        if (!showPassword) {
            if (email.trim() === "") {
                setError("Please enter an email address.");
                return;
            }
            if (!emailRegex.test(email)) {
                setError("Please enter a valid email address.");
                return;
            }
            setShowPassword(true);
            setText(method === "login" ? "Log in" : "Sign up");
            return;
        }

        if (!passwordRegex.test(password)) {
            setError("Invalid password.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(route, { email, password });

            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                await loadUser();
                navigate("/notes");
            } else {
                navigate("/check-email");
            }
        } catch (error) {

        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleButtonClick} className="form-container" noValidate>
            <div className="form-header">
                <h1 className="headline">Think it. Make it.</h1>
                {method === "login" ? (
                    <h2 className="form-subtitle">Log in to your Notes account</h2>
                ) : (
                    <h2 className="form-subtitle">Create your Notes account</h2>
                )}
            </div>

            <GoogleLoginButton />

            <input
                className="form-input"
                type="email"
                maxLength={255}
                value={email}
                placeholder="Email"
                onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                }}
                required
            />

            {showPassword && (
                <div className="password-container">
                    <input
                        className="form-input"
                        type="password"
                        maxLength={255}
                        value={password}
                        placeholder="Password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError(null);
                        }}
                        required
                    />
                    {method === "login" && (
                        <button type="button" className="btn-reset-password" onClick={() => navigate('/reset-password')}>Forgot password?</button>
                    )}
                    
                </div>
            )}

            <button className="form-button" type="submit" disabled={loading}>
                {text}
            </button>

            {error && (
                <div className="form-error">
                    <p>{error}</p>
                </div>
            )}

            <div>
                {method === "login" ? (
                    <p className="form-text">
                        Don't have an account? <a href="/register">Sign up</a>
                    </p>
                ) : (
                    <p className="form-text">
                        Already have an account? <a href="/login">Log in</a>
                    </p>
                )}
            </div>
        </form>
    );
}

export default Forms;
