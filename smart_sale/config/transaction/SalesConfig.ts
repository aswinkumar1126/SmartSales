
export const getIsTagEnabled = (saleTranType?:string ) =>{
    if(!saleTranType) return false;
    if(saleTranType  === "SA"){
        return true;
    }
}

export const getIsBillModalEnabled = (saleTranType?:string ) =>{
    if(!saleTranType) return false;
    if(saleTranType  === "SR"){
        return true;
    }
}