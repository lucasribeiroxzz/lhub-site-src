import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, getUserTransactions } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("user_session");

    if (!sessionCookie) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let userEmail = "";
    try {
        const session = JSON.parse(sessionCookie.value);
        userEmail = session.email;
    } catch (e) {
        return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    const user = findUserByEmail(userEmail);

    if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const transactions = getUserTransactions(userEmail);

    const sortedTransactions = transactions.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
        success: true,
        data: {
            name: user.name,
            email: user.email,
            balance: user.balance || 0,
            banned: user.banned === true,
            transactions: sortedTransactions
        }
    });
}
