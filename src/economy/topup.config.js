export const TOPUP_PACKAGES = [
    { id: 'package1', coins: 10000, price: 10000, label: '10K Coins', desc: 'Starter Pack', bonus: '0%' },
    { id: 'package2', coins: 55000, price: 50000, label: '55K Coins', desc: 'Popular Choice', bonus: '+10%' },
    { id: 'package3', coins: 120000, price: 100000, label: '120K Coins', desc: 'Best Value', bonus: '+20%' },
];

export function getPackageById(id) {
    return TOPUP_PACKAGES.find(p => p.id === id);
}
