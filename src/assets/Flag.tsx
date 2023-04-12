
type FlagProps = {
    size: string
}

const Flag: React.FC<FlagProps> = ({ size }) => {
    return (
        <svg aria-labelledby="flag" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title id="flag">Сдаться</title>
            <g clipPath="url(#clip0_27_131257)">
                <path d="M8 44H12H16" stroke="var(--text-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 44V4" stroke="var(--text-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M40 6H12V22H40L36 14L40 6Z" stroke="var(--text-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs>
                <clipPath id="clip0_27_131257">
                    <rect width={size} height={size} fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default Flag;