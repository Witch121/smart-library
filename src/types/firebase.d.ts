import { FirebaseApp } from "firebase/app";
import { Firestore, Timestamp } from "firebase/firestore";

declare module "firebase/firestore" {
  export { Firestore, Timestamp };
}

declare module "firebase/app" {
  export { FirebaseApp };
}
