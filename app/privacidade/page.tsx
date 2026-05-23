"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Eye, Database, CreditCard, Lock, UserCheck } from "lucide-react";

export default function PrivacidadePage() {
    return (
        <main className="min-h-screen bg-black text-white">
            {}
            <div className="fixed inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
                {}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </Link>

                {}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Shield className="w-8 h-8 text-purple-400" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold">Política de Privacidade</h1>
                    </div>
                    <p className="text-neutral-400">Última atualização: Janeiro de 2026</p>
                </div>

                {}
                <div className="space-y-8">
                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">1. Nosso Compromisso</h2>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">
                            A LHUB está comprometida em proteger sua privacidade. Esta política explica
                            como tratamos suas informações pessoais e quais medidas tomamos para
                            garantir a segurança dos seus dados.
                        </p>
                    </section>

                    {}
                    <section className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-green-400" />
                            <h2 className="text-xl font-semibold text-green-400">2. O Que NÃO Coletamos</h2>
                        </div>
                        <div className="text-neutral-300 leading-relaxed space-y-4">
                            <p className="font-semibold text-white">
                                Não coletamos e não armazenamos dados sensíveis como:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-neutral-300">
                                <li><strong>CPF</strong> - Não solicitamos seu CPF em nenhum momento</li>
                                <li><strong>RG ou documentos</strong> - Não pedimos documentos de identificação</li>
                                <li><strong>Dados bancários</strong> - Não armazenamos cartões ou chaves PIX</li>
                                <li><strong>Endereço</strong> - Não coletamos seu endereço físico</li>
                            </ul>
                        </div>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">3. O Que Coletamos</h2>
                        </div>
                        <div className="text-neutral-300 leading-relaxed space-y-4">
                            <p>Coletamos apenas os dados necessários para operar nossos serviços:</p>
                            <ul className="list-disc list-inside space-y-2 text-neutral-400">
                                <li><strong className="text-neutral-300">Email</strong> - Para criar sua conta e enviar confirmações</li>
                                <li><strong className="text-neutral-300">Nome de usuário</strong> - Para identificação na plataforma</li>
                                <li><strong className="text-neutral-300">UID do jogo</strong> - Para entregar os produtos comprados</li>
                                <li><strong className="text-neutral-300">Histórico de compras</strong> - Para suporte e referência</li>
                            </ul>
                        </div>
                    </section>

                    {}
                    <section className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">4. Processamento de Pagamentos</h2>
                        </div>
                        <div className="text-neutral-300 leading-relaxed space-y-4">
                            <p>
                                <strong className="text-white">Todos os pagamentos são processados diretamente pela MisticPay.</strong>
                            </p>
                            <p className="text-neutral-400">
                                Quando você realiza um pagamento via PIX, os dados são enviados diretamente
                                para o processador de pagamentos (MisticPay) e <strong className="text-neutral-300">nós não temos acesso</strong> às
                                suas informações bancárias ou dados do PIX.
                            </p>
                            <div className="bg-neutral-800/50 rounded-xl p-4">
                                <p className="text-sm text-neutral-400">
                                    📌 Nós recebemos apenas a confirmação de que o pagamento foi aprovado,
                                    sem acesso a dados bancários.
                                </p>
                            </div>
                        </div>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <UserCheck className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">5. Seus Direitos</h2>
                        </div>
                        <div className="text-neutral-300 leading-relaxed space-y-4">
                            <p>Você tem direito a:</p>
                            <ul className="list-disc list-inside space-y-2 text-neutral-400">
                                <li>Solicitar quais dados temos sobre você</li>
                                <li>Solicitar a exclusão da sua conta e dados</li>
                                <li>Atualizar suas informações a qualquer momento</li>
                            </ul>
                            <p className="text-neutral-400 text-sm">
                                Para exercer esses direitos, entre em contato conosco via Discord.
                            </p>
                        </div>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">6. Uso de Cookies</h2>
                        <p className="text-neutral-300 leading-relaxed">
                            Utilizamos cookies apenas para manter sua sessão ativa e lembrar suas
                            preferências. Não utilizamos cookies para rastreamento ou publicidade.
                        </p>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">7. Alterações na Política</h2>
                        <p className="text-neutral-300 leading-relaxed">
                            Podemos atualizar esta política periodicamente. Recomendamos que você
                            revise esta página regularmente para estar ciente de quaisquer mudanças.
                        </p>
                    </section>

                    {}
                    <div className="text-center pt-8 border-t border-white/10">
                        <p className="text-neutral-400 mb-4">
                            Confira também nossos termos de uso
                        </p>
                        <Link
                            href="/termos"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <Shield size={18} />
                            Termos de Uso
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
