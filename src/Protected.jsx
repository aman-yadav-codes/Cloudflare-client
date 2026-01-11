import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import axios from 'axios';
import API_URL from './config';

const Protected = () => {
    const [data, setData] = useState(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [error, setError] = useState(null);

    const fetchSecretData = async () => {
        setError(null);
        try {
            // Try to fetch data directly (no token)
            const response = await axios.post(`${API_URL}/api/secret`);
            setData(response.data.message);
            setShowCaptcha(false);
        } catch (err) {
            if (err.response && err.response.status === 401 && err.response.data.error === 'captcha_required') {
                console.log('Server requested captcha');
                setShowCaptcha(true);
                setError('Security check required. Please solve the captcha.');
            } else {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data');
            }
        }
    };

    const onCaptchaSuccess = async (token) => {
        console.log('Captcha solved, sending token...');
        try {
            // Retry fetch with token
            const response = await axios.post(`${API_URL}/api/secret`, { token });
            setData(response.data.message);
            setShowCaptcha(false);
            setError(null);
        } catch (err) {
            console.error('Verification error:', err);
            setError('Verification failed or server error');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-8">Protected Data Page</h1>

            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                {!data && !showCaptcha && (
                    <button
                        onClick={fetchSecretData}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Fetch Secret Data
                    </button>
                )}

                {showCaptcha && (
                    <div className="flex flex-col items-center">
                        <p className="mb-4 text-yellow-700 bg-yellow-100 p-2 rounded">
                            Security Check Required
                        </p>
                        <Turnstile
                            siteKey="0x4AAAAAACL0J1b1xhJib1H0"
                            onSuccess={onCaptchaSuccess}
                        />
                    </div>
                )}

                {data && (
                    <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded border border-blue-200">
                        <h3 className="font-bold mb-2">Secret Data:</h3>
                        <p>{data}</p>
                        <button
                            onClick={() => setData(null)}
                            className="mt-4 text-sm text-blue-600 hover:underline"
                        >
                            Clear
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Protected;
