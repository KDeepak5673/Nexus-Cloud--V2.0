import React from 'react'
import PricingSection from '../components/PricingSection'
import '../styles/PricingPage.css'

function PricingPage() {
    return (
        <div className="pricing-page bg-background min-h-screen py-12">
            <div className="container mx-auto max-w-7xl px-4">
                        <main>
                            <PricingSection />
                        </main>
                    </div>
        </div>
    )
}

export default PricingPage
