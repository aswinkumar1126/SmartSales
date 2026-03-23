// iconsMap.ts
import {
    DollarSign,
    User,
    Tag,
    CreditCard,
    Mail,
    Phone,
    Calendar,
    Lock,
    Eye,
    EyeOff,
    FileText,
    Home,
    Settings,
    ShoppingCart,
    IndianRupee,

 
} from "lucide-react";

// Map of string name -> ReactNode icon
export const ICONS_MAP: Record<string, React.ReactNode> = {
    

Dollar: <DollarSign size={ 16}  />,
User: <User size={ 16 } />,
Tag: <Tag size={ 16 } />,
Card: <CreditCard size={ 16 } />,
Email: <Mail size={ 16 } />,
Phone: <Phone size={ 16 } />,
Calendar: <Calendar size={ 16 } />,
Lock: <Lock size={ 16 } />,
Eye: <Eye size={ 16 } />,
EyeOff: <EyeOff size={ 16 } />,
File: <FileText size={ 16 } />,
Home: <Home size={ 16 } />,
Settings: <Settings size={ 16 } />,
Cart: <ShoppingCart size={ 16 } />,
Rupee: <IndianRupee size={16} />,
Password : <Lock size={ 16 } />,

};