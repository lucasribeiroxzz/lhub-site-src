"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Shield, Clock, MessageCircle, AlertTriangle, CreditCard } from "lucide-react";

export default function TermosPage() {
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
                            <FileText className="w-8 h-8 text-purple-400" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold">Termos de Uso</h1>
                    </div>
                    <p className="text-neutral-400">Última atualização: Janeiro de 2026</p>
                </div>

                {}
                <div className="space-y-8">
                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">
                            Ao utilizar os serviços da LHUB, você concorda com estes termos de uso.
                            É sua responsabilidade ler e entender completamente este documento antes de
                            realizar qualquer compra em nossa plataforma.
                        </p>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">2. Descrição dos Produtos</h2>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">
                            <strong className="text-white">É de extrema importância ler a descrição completa de cada produto antes de comprar.</strong>
                            {" "}Todas as informações sobre funcionamento, compatibilidade, limitações e requisitos
                            estão disponíveis na página de cada produto. Ao realizar a compra, você declara
                            ter lido e entendido todas as informações fornecidas.
                        </p>
                    </section>

                    {}
                    <section className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <h2 className="text-xl font-semibold text-red-400">3. Política de Reembolso</h2>
                        </div>
                        <div className="text-neutral-300 leading-relaxed space-y-4">
                            <p>
                                <strong className="text-white">Reembolsos são concedidos APENAS quando o erro é de nossa responsabilidade.</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-neutral-400">
                                <li>Erro na entrega do produto por falha do sistema</li>
                                <li>Produto não funciona conforme descrito na página</li>
                                <li>Duplicação de cobrança por erro técnico</li>
                            </ul>
                            <p className="text-neutral-400">
                                <strong className="text-neutral-300">Não concedemos reembolso em casos como:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-neutral-400">
                                <li>Compra por engano ou desistência após a compra</li>
                                <li>Não leu a descrição do produto</li>
                                <li>Incompatibilidade com seu dispositivo (quando informado na descrição)</li>
                                <li>Banimento da sua conta por uso de produtos de terceiros</li>
                            </ul>
                        </div>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageCircle className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">4. Suporte ao Cliente</h2>
                        </div>
                        <div className="text-neutral-300 leading-relaxed space-y-4">
                            <p>
                                Nosso suporte é realizado <strong className="text-white">exclusivamente via Discord</strong>.
                            </p>
                            <div className="bg-neutral-800/50 rounded-xl p-4 flex items-center gap-4">
                                <Clock className="w-8 h-8 text-purple-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">Horário de Atendimento</p>
                                    <p className="text-neutral-400">Segunda a Sexta: 08:00 às 17:00</p>
                                    <p className="text-neutral-500 text-sm">Horário de Brasília (BRT)</p>
                                </div>
                            </div>
                            <p className="text-neutral-400 text-sm">
                                Fora do horário de atendimento, deixe sua mensagem que responderemos no próximo dia útil.
                            </p>
                        </div>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-semibold">5. Pagamentos</h2>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">
                            Todos os pagamentos são processados de forma segura através da plataforma MisticPay.
                            Aceitamos PIX como forma de pagamento. Após a confirmação do pagamento, o produto
                            será entregue automaticamente ou em até 24 horas, conforme especificado na descrição.
                        </p>
                    </section>

                    {}
                    <section className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">6. Responsabilidades do Usuário</h2>
                        <ul className="list-disc list-inside space-y-2 text-neutral-300">
                            <li>Fornecer informações corretas no momento da compra (UID, email, etc.)</li>
                            <li>Ler a descrição completa antes de comprar</li>
                            <li>Não compartilhar produtos comprados com terceiros</li>
                            <li>Usar os produtos de forma responsável</li>
                        </ul>
                    </section>

                    {}
                    <div className="text-center pt-8 border-t border-white/10">
                        <p className="text-neutral-400 mb-4">
                            Confira também nossa política de privacidade
                        </p>
                        <Link
                            href="/privacidade"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <Shield size={18} />
                            Política de Privacidade
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
