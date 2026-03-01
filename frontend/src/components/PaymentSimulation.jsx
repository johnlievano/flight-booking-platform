import { useState } from 'react';

const PaymentSimulation = ({ onCancel, onSuccess, totalAmount, savedCard }) => {
    const [loading, setLoading] = useState(false);
    // Si el usuario tiene una tarjeta guardada, la seleccionamos por defecto
    const [paymentMethod, setPaymentMethod] = useState(savedCard ? 'saved' : 'new');

    const handlePayment = (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulacion de conexion segura con el banco
        setTimeout(() => {
            setLoading(false);
            onSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-[#2A3F45] p-6 text-white text-center">
                    <h2 className="text-xl font-bold text-[#E5B869]">Pasarela de Pago Segura</h2>
                    <p className="text-sm opacity-80 mt-1">Autorizacion de transaccion</p>
                </div>

                <form onSubmit={handlePayment} className="p-6 space-y-5">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                        <p className="text-sm text-gray-500 font-medium">Total a Pagar</p>
                        <p className="text-3xl font-bold text-green-600">${totalAmount.toLocaleString()}</p>
                    </div>

                    {/* Selector de metodo de pago */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Metodo de pago</p>
                        
                        {savedCard && (
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'saved' ? 'border-[#E5B869] bg-yellow-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    name="paymentMethod" 
                                    value="saved"
                                    checked={paymentMethod === 'saved'}
                                    onChange={() => setPaymentMethod('saved')}
                                    className="mr-3 text-[#E5B869] focus:ring-[#E5B869]"
                                />
                                <div>
                                    <p className="font-medium text-gray-800">Tarjeta guardada</p>
                                    <p className="text-xs text-gray-500">Terminada en •••• {savedCard.slice(-4)}</p>
                                </div>
                            </label>
                        )}

                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'new' ? 'border-[#E5B869] bg-yellow-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="new"
                                checked={paymentMethod === 'new'}
                                onChange={() => setPaymentMethod('new')}
                                className="mr-3 text-[#E5B869] focus:ring-[#E5B869]"
                            />
                            <p className="font-medium text-gray-800">Usar una tarjeta nueva</p>
                        </label>
                    </div>

                    {/* Formulario de tarjeta nueva (se oculta si usa la guardada) */}
                    {paymentMethod === 'new' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numero de Tarjeta</label>
                                <input type="text" placeholder="0000 0000 0000 0000" required={paymentMethod === 'new'} maxLength="16"
                                       className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                                    <input type="text" placeholder="MM/YY" required={paymentMethod === 'new'} maxLength="5"
                                           className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                                    <input type="password" placeholder="123" required={paymentMethod === 'new'} maxLength="3"
                                           className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onCancel} disabled={loading}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading}
                                className="flex-1 px-4 py-3 bg-[#E5B869] text-[#2A3F45] rounded-lg hover:bg-[#d4a556] font-bold shadow-sm transition-colors disabled:opacity-70">
                            {loading ? 'Procesando...' : 'Confirmar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentSimulation;