import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    try {
        const cookieStore = await cookies();
        

        const sessionCookie = cookieStore.get("user_session");
        

        const tokenCookie = cookieStore.get("user_token");
        
        if (!sessionCookie && !tokenCookie) {
            return NextResponse.json({ success: false, message: "No session" }, { status: 401 });
        }

        let userEmail = "";
        

        if (sessionCookie) {
            try {
                const session = JSON.parse(sessionCookie.value);
                userEmail = session.email;
            } catch (e) {

            }
        }
        
        if (!userEmail && tokenCookie) {
            try {
                const payload = await verifyToken(tokenCookie.value);
                if (payload && typeof payload === 'object' && 'email' in payload) {
                    userEmail = payload.email as string;
                }
            } catch (e) {
            }
        }

        if (!userEmail) {
            return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
        }

        const user = findUserByEmail(userEmail);

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                email: user.email,
                name: user.name
            }
        });
    } catch (e) {
        console.error('Error checking session:', e);
        return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
    }
}
