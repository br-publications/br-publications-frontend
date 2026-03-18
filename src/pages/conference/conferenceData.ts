// ============================================================
// Conference static data — single source of truth
// Will be replaced by API calls when the backend is ready.
// ============================================================

export interface Conference {
    id: number;
    title: string;
    publisher: string;
    publishedDate: string;
    location: string;
    issn?: string;
    doi?: string;
    articleCount: number;
    type: string;
    /** Short conference code used in detail banner (e.g. "SISCON 2025") */
    code?: string;
    /** Full for the detail banner */
    dateRange?: string;
}

export interface Article {
    id: number;
    confId: number;
    title: string;
    authors: string[];
    year: number;
    pages: string;
    abstract: string;
    doi?: string;
    keywords?: string[];
}

export interface AuthorDetail {
    affiliation: string;
}

// ── Conference list ──────────────────────────────────────────
export const CONFERENCES: Conference[] = [
    {
        id: 1,
        title: '2025 1st International Conference on Smart and Intelligent Systems (SISCON)',
        publisher: 'IEEE',
        publishedDate: 'Dec. 2025',
        location: 'Thiruvananthapuram, India',
        issn: '2995-4401',
        doi: '10.1109/SISCON66686.2025',
        articleCount: 78,
        type: 'Conference',
        code: 'SISCON 2025',
        dateRange: '19–20 Dec. 2025',
    },
    {
        id: 2,
        title: '2025 12th International Conference on Internet of Things: Systems, Management and Security (IOTSMS)',
        publisher: 'IEEE',
        publishedDate: 'Dec. 2025',
        location: 'Online',
        issn: '2767-9640',
        doi: '10.1109/IOTSMS2025',
        articleCount: 54,
        type: 'Conference',
        code: 'IOTSMS 2025',
        dateRange: 'Dec. 2025',
    },
    {
        id: 3,
        title: '2025 12th International Conference on Software Defined Systems (SDS)',
        publisher: 'IEEE',
        publishedDate: 'Dec. 2025',
        location: 'Paris, France',
        issn: '2473-0831',
        doi: '10.1109/SDS2025',
        articleCount: 36,
        type: 'Conference',
        code: 'SDS 2025',
        dateRange: 'Dec. 2025',
    },
    {
        id: 4,
        title: '2025 2nd International Conference on Advanced Technology in Electronic and Electrical Engineering (ICATEEE)',
        publisher: 'IEEE',
        publishedDate: 'Dec. 2025',
        location: 'Kuala Lumpur, Malaysia',
        issn: '2834-0981',
        doi: '10.1109/ICATEEE2025',
        articleCount: 42,
        type: 'Conference',
        code: 'ICATEEE 2025',
        dateRange: 'Dec. 2025',
    },
    {
        id: 5,
        title: '2025 32nd National and 10th International Iranian Conference on Biomedical Engineering (ICBME)',
        publisher: 'IEEE',
        publishedDate: 'Nov. 2025',
        location: 'Tehran, Iran',
        issn: '2164-1838',
        doi: '10.1109/ICBME2025',
        articleCount: 61,
        type: 'Conference',
        code: 'ICBME 2025',
        dateRange: 'Nov. 2025',
    },
    {
        id: 6,
        title: '2025 5th International Conference on Communication Technology and Information Technology (ICCTIT)',
        publisher: 'IEEE',
        publishedDate: 'Dec. 2025',
        location: 'Baghdad, Iraq',
        issn: '2994-1121',
        doi: '10.1109/ICCTIT2025',
        articleCount: 29,
        type: 'Conference',
        code: 'ICCTIT 2025',
        dateRange: 'Dec. 2025',
    },
    {
        id: 7,
        title: '2025 8th International Conference on Algorithms, Computing and Artificial Intelligence (ACAI)',
        publisher: 'ACM',
        publishedDate: 'Dec. 2025',
        location: 'Sanya, China',
        issn: '2767-1402',
        doi: '10.1145/ACAI2025',
        articleCount: 88,
        type: 'Conference',
        code: 'ACAI 2025',
        dateRange: 'Dec. 2025',
    },
    {
        id: 8,
        title: '2025 IEEE 2nd International Conference for Women in Computing (InCoWoCo)',
        publisher: 'IEEE',
        publishedDate: 'Nov. 2025',
        location: 'Dubai, UAE',
        issn: '2993-0051',
        doi: '10.1109/InCoWoCo2025',
        articleCount: 33,
        type: 'Conference',
        code: 'InCoWoCo 2025',
        dateRange: 'Nov. 2025',
    },
    {
        id: 9,
        title: '2025 International Conference on Machine Learning, Computational Intelligence and Pattern Recognition (MLCIPR)',
        publisher: 'IEEE',
        publishedDate: 'Dec. 2025',
        location: 'Colombo, Sri Lanka',
        issn: '2994-0021',
        doi: '10.1109/MLCIPR2025',
        articleCount: 47,
        type: 'Conference',
        code: 'MLCIPR 2025',
        dateRange: 'Dec. 2025',
    },
    {
        id: 10,
        title: '2026 IEEE 28th Topical Meeting on Silicon Monolithic Integrated Circuits in RF Systems (SiRF)',
        publisher: 'IEEE',
        publishedDate: 'Jan. 2026',
        location: 'San Antonio, TX, USA',
        issn: '2380-5706',
        doi: '10.1109/SiRF2026',
        articleCount: 22,
        type: 'Conference',
        code: 'SiRF 2026',
        dateRange: 'Jan. 2026',
    },
];

// ── Articles per conference ──────────────────────────────────
export const ARTICLES: Record<number, Article[]> = {
    1: [
        {
            id: 101, confId: 1,
            title: 'Advance Health Hazard Monitoring with Sustainable Wireless Sensor Networks',
            authors: ['Sumit Chopra', 'Jasmeet Kaur', 'Gagandeep Singh', 'Mamta Bansal', 'Sangeeta', 'Manmeet Kaur'],
            year: 2025, pages: '1-6',
            abstract: 'This paper presents a novel framework for real-time health hazard monitoring using sustainable wireless sensor networks. The proposed system integrates low-power sensor nodes with edge computing to enable continuous environmental and physiological parameter tracking in resource-constrained settings.',
            doi: '10.1109/SISCON66686.2025.11400001',
            keywords: ['Wireless Sensor Networks', 'Health Monitoring', 'Edge Computing', 'IoT'],
        },
        {
            id: 102, confId: 1,
            title: 'Retrieval-Augmented Generation and Knowledge Graphs for Intelligent Ayurvedic Chatbots',
            authors: ['R. Supal', 'S. M Anoor', 'C. Prem Sankar', 'G. V Abhilash'],
            year: 2025, pages: '1-6',
            abstract: 'We propose an intelligent Ayurvedic chatbot leveraging Retrieval-Augmented Generation (RAG) combined with structured knowledge graphs derived from traditional Ayurvedic texts. The system achieves improved factual accuracy and contextually appropriate recommendations compared to standard LLM-based chatbots.',
            doi: '10.1109/SISCON66686.2025.11400002',
            keywords: ['RAG', 'Knowledge Graphs', 'NLP', 'Chatbots'],
        },
        {
            id: 103, confId: 1,
            title: 'A Double Deep Q Network Approach to Control HVAC Systems',
            authors: ['Naqib Mirous-Mohammed', 'Syed Mohammed Farid', 'Andreas Alireza', 'T P Mohammed Yaseen S'],
            year: 2025, pages: '1-7',
            abstract: 'HVAC systems account for a significant portion of building energy consumption. This paper introduces a Double Deep Q-Network (DDQN) reinforcement learning framework for adaptive HVAC control that reduces energy usage by up to 23% while maintaining occupant thermal comfort within standard thresholds.',
            doi: '10.1109/SISCON66686.2025.11400003',
            keywords: ['Reinforcement Learning', 'HVAC', 'DDQN', 'Energy Efficiency'],
        },
        {
            id: 104, confId: 1,
            title: 'Enhanced Pet Image Classification with Deep Learning: A Comprehensive Model Comparison',
            authors: ['Anitha V', 'Veena Satheer R', 'Dearga S', 'Renzy Medona W', 'Uma Maheshwari M'],
            year: 2025, pages: '1-6',
            abstract: 'This study benchmarks five state-of-the-art convolutional architectures—VGG16, ResNet50, EfficientNet-B4, MobileNetV3, and Vision Transformer—for fine-grained pet breed classification across a dataset of 37 breeds. Transfer learning with domain-specific augmentation yields 96.3% top-1 accuracy.',
            doi: '10.1109/SISCON66686.2025.11400004',
            keywords: ['Deep Learning', 'Image Classification', 'Transfer Learning', 'CNN'],
        },
        {
            id: 105, confId: 1,
            title: 'Transformer-Based Approach for Pragmatic Ambiguity Detection in Natural Language Processing',
            authors: ['Reena S. Satpute', 'Nura Muhammad Sani'],
            year: 2025, pages: '1-6',
            abstract: 'Pragmatic ambiguity is a sentence or phrase that can mean different things depending on situation. In machine understanding it is often necessary to examine many possible contexts. We introduce a transformer-based model using BERT to detect pragmatic ambiguity, achieving 88% accuracy against a 75% logistic regression baseline.',
            doi: '10.1109/SISCON66686.2025.11409186',
            keywords: ['NLP', 'Transformer', 'BERT', 'Pragmatic Ambiguity', 'Machine Learning'],
        },
        {
            id: 106, confId: 1,
            title: 'Sentiment Analysis in Finance: Predicting Market Trends with Artificial Intelligence',
            authors: ['Anisha S. Salpide', 'Dinara V', 'Chaitalnya Hera', 'Muhammad Sani'],
            year: 2025, pages: '1-5',
            abstract: 'Financial sentiment analysis using AI techniques enables prediction of market movements from news and social media. This paper proposes a multi-source sentiment fusion model combining BERT and temporal attention to forecast next-day equity price direction with 79.4% accuracy on S&P 500 stocks.',
            doi: '10.1109/SISCON66686.2025.11400006',
            keywords: ['Sentiment Analysis', 'Finance', 'BERT', 'Stock Market Prediction'],
        },
        {
            id: 107, confId: 1,
            title: 'AnaPose – Anatomy Aware Loss for Pose Estimation in the Operating Room',
            authors: ['Jasra P.K.', 'Jibin Jose'],
            year: 2025, pages: '1-6',
            abstract: 'Operating room scenarios present unique challenges for human pose estimation due to occlusions from surgical gowns and equipment. We introduce AnaPose, an anatomy-aware loss function that enforces skeletal constraints during training, improving PCKh@0.5 by 4.2% over baseline HRNet models.',
            doi: '10.1109/SISCON66686.2025.11400007',
            keywords: ['Pose Estimation', 'Medical AI', 'HRNet', 'Computer Vision'],
        },
        {
            id: 108, confId: 1,
            title: 'Encrypted Text Based Emotion Detection System Using Transformer Model',
            authors: ['Ashna Yousuf', 'Salel A'],
            year: 2025, pages: '1-5',
            abstract: 'Privacy-preserving emotion detection is critical for sensitive communication platforms. This work presents an encrypted text emotion detection system leveraging homomorphic encryption with a fine-tuned RoBERTa model, achieving near-parity with plaintext accuracy while ensuring end-to-end data confidentiality.',
            doi: '10.1109/SISCON66686.2025.11400008',
            keywords: ['Emotion Detection', 'Encryption', 'RoBERTa', 'Privacy'],
        },
    ],
};

// ── Per-author affiliations ──────────────────────────────────
export const AUTHOR_DETAILS: Record<string, AuthorDetail> = {
    'Reena S. Satpute': { affiliation: 'Faculty of Science & Technology, School of Allied Sciences, DMIHER, Sawangi (M), Maharashtra, India' },
    'Nura Muhammad Sani': { affiliation: 'Department of Computer Science, School of Science and Technology, FPK Kaltungo, Gombe State, Nigeria' },
    'Sumit Chopra': { affiliation: 'Department of Computer Science, Punjab Technical University, Jalandhar, India' },
    'Jasmeet Kaur': { affiliation: 'Department of Electronics, Chandigarh University, Punjab, India' },
};
