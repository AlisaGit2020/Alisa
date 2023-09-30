import {DataSource} from "typeorm";

// Using environment variables
import dotenv from "dotenv";

dotenv.config();

const dataSource = new DataSource({
    type: "postgres",
    logging: false,
    synchronize: true,
    entities: ["../dist/entities/*.js"],
    host: "127.0.0.1",
    port: 5439,
    username: "postgres",
    password: "mysecretpassword",
    database: "alisa",
    ssl: false
})

dataSource
    .initialize()
    .then(() => {
        console.log(`Data Source has been initialized`);
    })
    .catch((err) => {
        console.error(`Data Source initialization error`, err);
    })

export default dataSource;