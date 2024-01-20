class Logger {
    public static error(message: string) {
        console.error(message)
    }

    public static info(message: unknown) {
        console.log(message)
    }
}

export default Logger