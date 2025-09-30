
# Business Intelligence Dashboard

A next-generation AI-powered business intelligence dashboard that transforms your CSV data into beautiful visualizations with intelligent insights. 

## 🚀 Features 

- **Multi-Industry Support**: Optimized schemas for Sales, Retail, Finance, Healthcare, and general business data
- **Smart CSV Validation**: Advanced validation engine with AI-powered suggestions for data quality improvement
- **Interactive Visualizations**: Beautiful charts and graphs using Recharts library
- **AI-Generated Insights**: Automatic caption generation for charts highlighting key trends and anomalies
- **Data Quality Analysis**: Comprehensive validation with error detection, outlier identification, and data completeness scoring
- **Responsive Design**: Works seamlessly across desktop and mobile devices 
- **Dark/Light Mode**: Toggle between themes for optimal viewing experience

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **File Processing**: PapaParse for CSV handling
- **Icons**: Lucide React
- **Deployment**: Lovable Platform

## 📊 Supported Data Types

### Sales Data
- Required fields: Invoice ID, Customer Name, Product, Quantity
- Optional fields: Unit Price, Total, Region, Sale Date

### Retail Data
- Required fields: Product, Category, Price, Region
- Optional fields: Brand, Stock, Supplier, Date

### Finance Data
- Required fields: Account, Transaction Type, Amount, Date
- Optional fields: Description, Reference, Balance

### Healthcare Data
- Required fields: Patient ID, Service, Provider, Amount
- Optional fields: Date, Insurance, Diagnosis

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd business-intelligence-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 📈 How to Use

1. **Select Industry**: Choose your business type from the dropdown menu
2. **Upload CSV File**: Drag and drop or select your CSV file (max 100,000 rows)
3. **Review Validation**: Check data quality results and fix issues with AI assistance
4. **Explore Dashboard**: View interactive charts and AI-generated insights

## 🔧 Data Validation Features

- **Missing Field Detection**: Identifies required fields missing from your CSV
- **Data Type Validation**: Ensures numeric, date, and text fields are properly formatted
- **Outlier Detection**: Flags unusual values that may need attention
- **Empty Value Analysis**: Reports on data completeness
- **Format Validation**: Supports multiple date formats (YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY, etc.)

## 📊 Visualization Types

- **Bar Charts**: Compare values across categories
- **Line Charts**: Show trends over time
- **Pie Charts**: Display proportional data
- **Area Charts**: Visualize cumulative data
- **Scatter Plots**: Identify correlations

## 🤖 AI Features

- **Smart Schema Mapping**: Automatically maps CSV columns to expected fields
- **Data Quality Suggestions**: Provides recommendations for improving data quality
- **Insight Generation**: Creates meaningful captions for visualizations
- **Error Resolution**: Offers solutions for common data issues

## 🔒 Data Security

- All data processing happens locally in your browser
- No data is sent to external servers (except for AI caption generation)
- CSV files are processed client-side using PapaParse

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🎨 Customization

The dashboard uses Tailwind CSS for styling. You can customize the appearance by modifying the theme in `tailwind.config.ts`.

## 📦 Build and Deployment

To build for production:

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## 🧪 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── FileUpload.tsx  # File upload component
│   └── ...
├── pages/              # Page components
├── utils/              # Utility functions
│   ├── validationEngine.ts
│   └── rowLimitValidator.ts
└── integrations/       # External integrations
```

### Key Components

- **Index.tsx**: Main application component with step-by-step flow
- **ValidationResults.tsx**: Displays validation results and AI suggestions
- **Dashboard.tsx**: Interactive dashboard with charts and insights
- **FileUpload.tsx**: Handles CSV file uploads and processing

## 🐛 Troubleshooting

### Common Issues

1. **File too large**: Maximum supported file size is 100,000 rows
2. **Invalid date formats**: Ensure dates follow supported formats
3. **Missing required fields**: Check that your CSV includes all required columns for your industry

### Error Messages

The application provides detailed error messages with suggestions for resolution. Use the "Fix with AI" feature for automated solutions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) - The AI-powered development platform
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**Happy analyzing!** 🚀📊
