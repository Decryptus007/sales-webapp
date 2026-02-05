# Sales Invoice Management System

A modern, responsive web application for managing sales invoices with file attachments, built with Next.js 16, React 19, and TypeScript.

## 🚀 Features

### Core Functionality
- **Invoice Management**: Create, edit, view, and delete sales invoices
- **File Attachments**: Upload one file per invoice (PDF, images, documents up to 10MB)
- **Payment Tracking**: Track payment status (Paid, Unpaid, Partially Paid, Overdue)
- **Advanced Filtering**: Filter invoices by date range and payment status
- **Real-time Updates**: Instant UI updates without page refreshes
- **Data Persistence**: Local storage with automatic data migration

### User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Toast Notifications**: Real-time feedback for user actions
- **Confirmation Modals**: Safe deletion with confirmation dialogs
- **Loading States**: Smooth loading indicators and skeleton screens
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Technical Features
- **Type Safety**: Full TypeScript implementation with strict typing
- **Form Validation**: Robust form validation with Zod schemas
- **Testing**: Comprehensive test suite with Jest and React Testing Library
- **Performance**: Optimized with React 19 features and Next.js 16
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation

### Development Tools
- **Jest** - JavaScript testing framework
- **React Testing Library** - Simple and complete testing utilities
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Fast-Check** - Property-based testing

### Key Libraries
- **date-fns** - Modern JavaScript date utility library
- **react-day-picker** - Flexible date picker component
- **lucide-react** - Beautiful & consistent icon toolkit
- **clsx** - Utility for constructing className strings

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sales-webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── create/            # Create invoice page
│   ├── edit/[id]/         # Edit invoice page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── demo/              # Demo components
│   ├── forms/             # Form components
│   ├── invoice/           # Invoice-specific components
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── __tests__/             # Test files
```

## 🎯 Usage

### Creating an Invoice
1. Click "Create Invoice" on the home page
2. Fill in invoice details (number, date, customer info)
3. Add line items with descriptions, quantities, and prices
4. Set payment status
5. Optionally upload one file attachment
6. Click "Create Invoice" to save

### Managing Invoices
- **View**: Browse all invoices on the home page
- **Filter**: Use the filter panel to find specific invoices
- **Edit**: Click the edit button on any invoice
- **Delete**: Click delete and confirm to remove an invoice

### File Attachments
- Each invoice can have one file attachment (max 10MB)
- Supported formats: PDF, images, Word docs, Excel files, text files
- Files are stored locally and persist between sessions
- Delete current file to upload a different one

## 🧪 Testing

The project includes comprehensive tests covering:
- Component rendering and interactions
- Custom hooks functionality
- Form validation
- File upload/download operations
- Error handling scenarios

Run tests:
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
```

## 🔧 Configuration

### Environment Variables
No environment variables are required for basic functionality. All data is stored locally in the browser.

### Customization
- **Styling**: Modify `tailwind.config.js` for theme customization
- **Validation**: Update schemas in `src/lib/validations.ts`
- **Storage**: Extend `src/hooks/useLocalStorage.ts` for different storage backends

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure accessibility compliance
- Test on multiple devices/browsers

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- File attachments are stored in browser local storage (limited by browser storage quotas)
- Data is not synchronized across devices or browsers
- No user authentication or multi-tenancy support

## 🔮 Future Enhancements

- [ ] Cloud storage integration for file attachments
- [ ] User authentication and authorization
- [ ] Multi-tenant support
- [ ] Invoice templates and customization
- [ ] Email integration for sending invoices
- [ ] Reporting and analytics dashboard
- [ ] Export functionality (PDF, CSV)
- [ ] Recurring invoice support
- [ ] Integration with payment processors

## 📞 Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**Built with ❤️ using Next.js, React, and TypeScript**