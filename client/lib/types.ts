export type Campaign = {
    id:Number,
    title:string,
    creatorId:string,
    description:string,
    startDate:string,
    endDate:string,
    fundingGoal:Number,
    amountRaised:Number,
    documents:string[],
    donorAddresses:string[],
    donatedAmount:Number[],
    status:string,
    numberOfAuditors:Number,
    auditorAddress?:string[],
    auditorStatus?:boolean[]
}