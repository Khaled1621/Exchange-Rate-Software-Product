import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import React, { useState } from "react";

export default function ChangePassword({
    open,
    onSubmit,
    onClose,
    title,
    submitText,
}) {
    let [oldPassword, setOldPassword] = useState("");
    let [newPassword, setNewPassword] = useState("");
    let [confirmPassword, setConfirmPassword] = useState("");

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <div className="dialog-container">
                <DialogTitle>{title}</DialogTitle>
                <div className="form-item">
                    <TextField
                        fullWidth
                        label="Old Password"
                        type="password"
                        value={oldPassword}
                        onChange={({ target: { value } }) => setOldPassword(value)}
                    />
                </div>
                <div className="form-item">
                    <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={({ target: { value } }) => setNewPassword(value)}
                    />
                </div>
                <div className="form-item">
                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={({ target: { value } }) => setConfirmPassword(value)}
                    />
                </div>
                <Button
                    color="primary"
                    variant='contained'
                    onClick={() => onSubmit({ oldPassword, newPassword, confirmPassword })}
                >
                    {submitText}
                </Button>
            </div>
        </Dialog>
    );
}