import { useState } from "react"
import { useParams } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import api from "../api";
export default function PasswordResetConfirm() {
    const params = useParams();
    const navigate = useNavigate();
    const uid = params.uid;
    const token = params.token;
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleButtonClick = async (e) => {
        e.preventDefault();
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
        if (!password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!passwordRegex.test(password)) {
            setError("Invalid password.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/api/user/password_reset_confirm/', { uid, token, password });
            if (res.status === 200) {
                setError(null);
                navigate("/login", { state: { message: "Password reset successful. You can now log in." } });
            } else {
                setError("Failed to reset password. Please try again.");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="authentication-container">
            <form className="form-container" onSubmit={handleButtonClick} noValidate>
            <h1 className="headline">New Password</h1>
            <input type="password" className="form-input" autoComplete="password" 
                value={password} maxLength={255} name='password'placeholder="Password" 
                onChange={(e)=>{setPassword(e.target.value)}} />
            <input type="password" className="form-input" autoComplete="password"
                value={confirmPassword} maxLength={255} name='confirmPassword' placeholder="Confirm Password" 
                onChange={(e)=>{setConfirmPassword(e.target.value)}} />
            {error && (
                <div className="form-error">
                    <p>{error}</p>
                </div>
            )}
            <button type="submit" className="form-button" disabled={loading}>
                Change Password
            </button>
            </form>
            
        </div>
    )
}