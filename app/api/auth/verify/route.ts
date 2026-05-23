import { NextResponse } from "next/server";
import { findUserByEmail, updateUser } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const user = findUserByEmail(email);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (user.isVerified) {
            return NextResponse.json({
                success: true,
                message: "User already verified"
            });
        }

        if (!user.otpExpires || new Date().getTime() > user.otpExpires) {
            return NextResponse.json(
                { error: "Code expired" },
                { status: 400 }
            );
        }

        if (user.otp !== code) {
            return NextResponse.json(
                { error: "Invalid code" },
                { status: 400 }
            );
        }

        updateUser(email, {
            isVerified: true,
            otp: undefined,
            otpExpires: undefined
        });

        return NextResponse.json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
