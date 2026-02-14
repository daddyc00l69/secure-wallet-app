async function testRegister() {
    try {
        const response = await fetch('http://localhost:8000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'debug_user_' + Date.now(),
                password: 'password123'
            })
        });

        const text = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', text);

        try {
            const data = JSON.parse(text);
            if (!response.ok) {
                console.error('API Error:', data);
            } else {
                console.log('Success:', data);
            }
        } catch (e) {
            console.log('Response is not JSON');
        }

    } catch (err) {
        console.error('Network Error:', err.message);
    }
}

testRegister();
