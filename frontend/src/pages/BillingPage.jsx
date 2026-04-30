import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import PricingCards from '../components/billing/PricingCards';
import PaymentHistory from '../components/billing/PaymentHistory';
import SubscriptionStatus from '../components/billing/SubscriptionStatus';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Check, CreditCard, Loader2 } from 'lucide-react';

export default function BillingPage() {
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('stripe');

    const { data: user, isLoading: loadingUser } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const res = await api.get('auth/me');
            return res.data.data;
        }
    });

    const { data: subscription, isLoading: loadingSub } = useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            const res = await api.get('payments/me');
            return res.data.data;
        }
    });

    const { data: history, isLoading: loadingHistory } = useQuery({
        queryKey: ['paymentHistory'],
        queryFn: async () => {
            const res = await api.get('payments/history');
            return res.data.data;
        }
    });

    const checkoutMutation = useMutation({
        mutationFn: async (plan) => {
            setIsProcessing(true);
            const res = await api.post('payments/checkout', { plan, provider: selectedProvider });
            return res.data;
        },
        onSuccess: (data) => {
            if (selectedProvider === 'stripe' && data.url) {
                window.location.href = data.url;
            } else if (selectedProvider === 'razorpay' && data.order) {
                handleRazorpayPayment(data.order);
            }
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Checkout failed');
            setIsProcessing(false);
        }
    });

    const handleRazorpayPayment = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: "MeterFlow",
            description: `Payment for ${order.notes.plan} plan`,
            order_id: order.id,
            handler: async (response) => {
                try {
                    await api.post('payments/verify', {
                        ...response,
                        plan: order.notes.plan
                    });
                    queryClient.invalidateQueries(['user', 'subscription', 'paymentHistory']);
                    alert('Payment successful!');
                } catch (err) {
                    alert('Verification failed');
                } finally {
                    setIsProcessing(false);
                }
            },
            prefill: {
                name: user?.name,
                email: user?.email,
            },
            theme: {
                color: "#3b82f6",
            },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    if (loadingUser || loadingSub) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h2>
                    <p className="text-muted-foreground">Manage your plan, limits and view payment history.</p>
                </div>
                <div className="flex items-center gap-2 bg-secondary p-1 rounded-md">
                    <button
                        onClick={() => setSelectedProvider('stripe')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedProvider === 'stripe' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                    >
                        Stripe
                    </button>
                    <button
                        onClick={() => setSelectedProvider('razorpay')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedProvider === 'razorpay' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                    >
                        Razorpay
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <SubscriptionStatus subscription={subscription} user={user} />
                </div>
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="text-white">Professional Pack</CardTitle>
                        <CardDescription className="text-primary-foreground/80">Get the best out of MeterFlow.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 mb-6">
                            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" /> Priority Support</li>
                            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" /> Advanced Analytics</li>
                            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" /> Scale up to 100k requests</li>
                        </ul>
                        <Button variant="secondary" className="w-full text-primary font-bold">Contact Enterprise</Button>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4">Choose a Plan</h3>
                <PricingCards
                    currentPlan={user?.plan}
                    onSelectPlan={(plan) => {
                        if (!plan) {
                            alert("Plan is missing");
                            return;
                        }

                        checkoutMutation.mutate(plan);
                    }}
                />
            </div>

            <PaymentHistory history={history} />

            {isProcessing && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-medium">Processing your request...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
