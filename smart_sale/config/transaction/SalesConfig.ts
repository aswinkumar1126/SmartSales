
export const getIsTagEnabled = (saleTranType?:string ) =>{
    if(!saleTranType) return false;
    if(saleTranType  === "SA" || saleTranType === "SR"){
        return true;
    }
}