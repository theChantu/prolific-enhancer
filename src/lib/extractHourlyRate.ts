function extractHourlyRate(text: string) {
    const m = text.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : NaN;
}

export default extractHourlyRate;
