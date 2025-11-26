export class Feed {
    constructor(angle, offset) {
        this.angle = angle; // 10dB beamwidth in degrees
        this.offset = offset; // Height offset from focus
    }

    getPower(theta) {
        // Simple model: Gaussian or Cosine power distribution
        // Let's use a cosine power model: P(theta) = cos^n(theta)
        // We want P(theta_10dB/2) = 0.1 (since 10dB is factor of 10)
        // 10*log10(P) = -10 => P = 0.1

        const halfAngle = (this.angle / 2) * (Math.PI / 180);
        // 0.1 = cos^n(halfAngle)
        // log(0.1) = n * log(cos(halfAngle))
        // n = log(0.1) / log(cos(halfAngle))

        if (Math.abs(halfAngle) < 0.001) return 0; // Avoid division by zero
        const n = Math.log(0.1) / Math.log(Math.cos(halfAngle));

        return (theta) => {
            if (Math.abs(theta) > Math.PI / 2) return 0;
            return Math.pow(Math.cos(theta), n);
        };
    }
}
