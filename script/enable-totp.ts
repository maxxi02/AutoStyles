// script/enable-totp.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({
  credential: cert({
    projectId: "autostyles-76646",
    clientEmail:
      "firebase-adminsdk-fbsvc@autostyles-76646.iam.gserviceaccount.com",
    privateKey:
      "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDsFfipGNeXY4lj\nBxiPJu4Vsmc7Fp5JXbmSAMoWyHgOb1lXMxVwKU/7WH433AWQWwZc9sVwWauM+f45\nRNtaxIwu6n0H5AvA6Wls44AYgxdAgISnXU41rLVotR7Tqqf8Wm7DWjsXy/+hXcHG\n4gmv8Br7N8KeceymW0OD5TVyYOWIWsZkDcxLCP51RrrMqLstG5YQ9s06Ttme+p4g\neuPA9mucbw9i9erfbmlLLajq7JrI3rX57GXLZeSFbNfiGBsG8fs+jYiaVAco/ItL\nbBnuzg87FyvoBaj6PBXtVDWJ9s77oqjyZLMYVx4kFL7Zm0JGgecd02HJtl2nnfOC\nqCbXTj2FAgMBAAECggEAKc+zWAlTB1gEyTHExveTU2ri7vtQwbgUaTf0EohjANV2\nGmQs8A4VAPP5eJ2iK6B/VkALFByBbiiJPm3ENoVYOWfkiFz6OuprtjHtagnveIg6\nViTHeOiTQU3QfZa8BQykELt+ezaxGYxQCQ/XvN3WfXbw5BxTl9vSb33M0yq3hAgO\nf3LS+BDh78FX63HHrKUoPqpGHBWvTLQsdo+u0g5YKICztYct+VtWNbvXBQAIklVK\nhnL3yJ6niB/drYYsTRCg9PwwHrqSkdrh5kiIbAaHZ/s/Ib2dk6HsHeh/WGCVxdIE\nhwlPc7rwrDDc36DfBtstDQvJhMfKSkUSG15Y6J1P4QKBgQD71n1fcA0gyqgvmiDB\nE0vey1grp58p9jMILuxLnbm+qUy4wF2FtGtEkZnDqNsx5/VXpM7/fkz4Bub3wClU\nbSWf3C/9eJH5AmNC3DkzRRKufyOZM787P3q4mbCbaWBdietuIRlBjnFtnG6/VOAh\nvVpEY7DgPdyFdLZRdynlTL7wZQKBgQDv/NX0Fuh6flocWRNKuSBk5tgTZvyQu8l+\n0tXJ39zonW1V6zN19RsSqM2M2X+sFicRcIOkJQXR4gPQm4JoJrMshJlNYGSoUyGS\nvOHLzYkf3euH9pCbgGUTgjJxaK9oSZhBWbn6YpFo44AasRum/vaS5wXIMjPXz8Eq\nD5Xqh9j2oQKBgQCsK9640b1X7tT+/ktoVI3pOnIEHmv1XylSbeoEZEeprssSAAmw\nMEGptjU+jAGXY/LawYT3LVznsKhVNt3Kp3gyi3GPw89gQx6jhjXg9FcqTyeCRNt3\nYRXAgOo5xdgo+vKm7x/6Lq0jd/BLBHba+j5tRQ6WsBREdR90IJjW+BoN9QKBgQCR\nOOSXgk1H4rHQua5M513M8UwL4aQwSRKTZi3srUTWln0VIvDPDnVFg1RvSSZTEkyt\n5vIiIC03Zpd8Yr41HEYMSGkkQ5JlsXh9fUL9uvChkf73FaNIFhgUCBNSQVDzwKUb\n1poOBBuN5y0b+dSL53l6R8Zd8NMiYxu2whusAmyuQQKBgFVU1NqPeg5gz0jKe01W\niLUXKVIoPPkTnL3ZpppX/iHOMjczeSTqHls4V6J6mF8XJzbMAmP6bDgt5lyYm/Hu\ni35Q7ymkjQzlEpkVeM9wZDQrmc6yeIO80uF/DZeiNaKtD8Qp8xgYe5h0dyQYOdtO\nMP/pYMk0B0Z7bptWejiwu1ta\n-----END PRIVATE KEY-----\n",
  }),
});

async function enableTOTP() {
  try {
    await getAuth()
      .projectConfigManager()
      .updateProjectConfig({
        multiFactorConfig: {
          state: "ENABLED",
          providerConfigs: [
            {
              state: "ENABLED",
              totpProviderConfig: {
                adjacentIntervals: 2, // Adjust as needed
              },
            },
          ],
        },
      });
    console.log("✅ TOTP MFA enabled successfully!");
  } catch (error) {
    console.error("❌ Error enabling TOTP MFA:", error);
  }
}

enableTOTP();
