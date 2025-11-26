export class Parabola {
    constructor(D, f) {
        this.D = D;
        this.f = f;
    }

    // Get y coordinate for a given x
    getY(x) {
        return (x * x) / (4 * this.f);
    }

    // Get slope at x
    getSlope(x) {
        return x / (2 * this.f);
    }

    // Get normal vector at x
    getNormal(x) {
        const m = this.getSlope(x);
        // Normal slope is -1/m
        // Vector is (-m, 1) normalized? 
        // Tangent vector is (1, m). Normal is (-m, 1).
        const len = Math.sqrt(m * m + 1);
        return { x: -m / len, y: 1 / len };
    }
}
