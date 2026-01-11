import React, { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import axios from 'axios';
import API_URL from './config';

const Protected = () => {
    const [data, setData] = useState(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [error, setError] = useState(null);
    const [csrfToken, setCsrfToken] = useState(null);

    useEffect(() => {
        // Fetch CSRF token on mount
        const fetchCsrfToken = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
                setCsrfToken(response.data.csrfToken);
            } catch (err) {
                console.error('Error fetching CSRF token:', err);
            }
        };
        fetchCsrfToken();
    }, []);

    const fetchSecretData = async () => {
        if (!csrfToken) {
            setError('Initializing security...');
            return;
        }

        try {
            // Try to fetch data directly (with credentials/cookies and CSRF token)
            const response = await axios.get(`${API_URL}/api/secret`, {
                withCredentials: true,
                headers: {
                    'x-csrf-token': csrfToken
                }
            });
            setData(response.data.message);
            setShowCaptcha(false);
            setError(null);
        } catch (err) {
            // Check if server challenged the request
            if (err.response && err.response.status === 403) {
                if (err.response.data.requireCaptcha) {
                    console.log('Server challenged request: Captcha required');
                    setShowCaptcha(true);
                    setError('Security Check Required');
                } else {
                    setError('Access Denied (CSRF or Invalid Session)');
                }
            } else {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data');
            }
        }
    };

    const onCaptchaSuccess = async (token) => {
        console.log('Captcha solved, retrying request with token...');
        try {
            // Retry the request with the token in headers AND credentials AND CSRF
            const response = await axios.get(`${API_URL}/api/secret`, {
                headers: {
                    'x-turnstile-token': token,
                    'x-csrf-token': csrfToken
                },
                withCredentials: true
            });

            setData(response.data.message);
            setShowCaptcha(false);
            setError(null);
        } catch (err) {
            console.error('Verification error:', err);
            setError('Verification failed or Server rejected token');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-8">Protected Data Page</h1>

            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                {!data && !showCaptcha && (
                    <button
                        onClick={fetchSecretData}
                        disabled={!csrfToken}
                        className={`px-6 py-3 text-white rounded-lg transition-colors ${csrfToken ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {csrfToken ? 'Fetch Secret Data' : 'Initializing...'}
                    </button>
                )}

                {showCaptcha && (
                    <div className="flex flex-col items-center">
                        <p className="mb-4 text-yellow-700 bg-yellow-100 p-2 rounded">
                            {error || 'Security Check Required'}
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

                {error && !showCaptcha && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Protected;
