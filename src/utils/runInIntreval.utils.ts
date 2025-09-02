import logger from "../config/winston_logger";

export const runInInterval = (
    id: string,
    callback: () => Promise<{break: boolean}>,
    interval: number,
    maxRuns: number = 30
): void => {
    let runCount = 0;

    const intervalId = setInterval(async () => {
        logger.warn(`Running callback function ${runCount + 1} / ${maxRuns} time for ${id}`);
        const result = await callback();

        if (result.break) {
            clearInterval(intervalId);
            logger.info(`Interval stopped for ${id}, because it resolved in success or failure`);
        }
        runCount++;


        if (runCount >= maxRuns) {
            clearInterval(intervalId);
            logger.info(`Interval stopped after ${maxRuns} executions for ${id}`);
        }
    }, interval);
};
