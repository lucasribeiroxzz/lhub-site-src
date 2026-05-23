import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken, verifyToken } from '@/lib/auth';
import { findUserByEmail, updateUser, getUsers } from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.email !== 'string') {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const user = findUserByEmail(decoded.email);

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                email: user.email,
                name: user.name,
                discordId: user.discordId,
                discordUsername: user.discordUsername,
                discordAvatar: user.discordAvatar,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.email !== 'string') {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const user = findUserByEmail(decoded.email);

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const body = await request.json();
        const { name, email } = body;

        if (name && (name.length < 2 || name.length > 50)) {
            return NextResponse.json({ error: 'Nome deve ter entre 2 e 50 caracteres' }, { status: 400 });
        }

        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
            }

            const existingUser = findUserByEmail(email);
            if (existingUser) {
                return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 });
            }
        }

        const updates: any = {};
        if (name) updates.name = name;
        if (email && email !== user.email) {
            updates.email = email;
            updates.id = email;
        }

        const updatedUser = updateUser(user.email, updates);

        if (!updatedUser) {
            return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
        }

        if (email && email !== user.email) {
            const newToken = await signToken({
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role
            });

            const response = NextResponse.json({
                success: true,
                message: 'Perfil atualizado com sucesso',
                data: {
                    email: updatedUser.email,
                    name: updatedUser.name
                }
            });

            response.cookies.set('user_token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7
            });

            return response;
        }

        return NextResponse.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: {
                email: updatedUser.email,
                name: updatedUser.name
            }
        });

    } catch (error: any) {
        console.error('[Profile Update] Error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.email !== 'string') {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const user = findUserByEmail(decoded.email);

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        if (!user.discordId) {
            return NextResponse.json({ error: 'Nenhuma conta Discord vinculada' }, { status: 400 });
        }

        if (!user.password) {
            return NextResponse.json({
                error: 'Você precisa definir uma senha antes de desvincular o Discord'
            }, { status: 400 });
        }

        updateUser(user.email, {
            discordId: undefined,
            discordUsername: undefined,
            discordAvatar: undefined
        });

        return NextResponse.json({
            success: true,
            message: 'Discord desvinculado com sucesso'
        });

    } catch (error) {
        return NextResponse.json({ error: 'Erro ao desvincular Discord' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.email !== 'string') {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const user = findUserByEmail(decoded.email);

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 });
        }

        if (user.password) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Senha atual é obrigatória' }, { status: 400 });
            }
            if (user.password !== currentPassword) {
                return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
            }
        }

        updateUser(user.email, { password: newPassword });

        return NextResponse.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error: any) {
        console.error('[Profile Password] Error:', error);
        return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
    }
}
