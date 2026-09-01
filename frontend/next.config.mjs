const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "www.kia.com",
            },
            {
                protocol: "https",
                hostname: "toyota.co.kr",
            },
            {
                protocol: "https",
                hostname: "wizz.volvocars.com",
            },
        ],
    },
};

export default nextConfig;