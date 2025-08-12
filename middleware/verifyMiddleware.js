const roleMiddleware =(roles)=>{
    return (req,res,next)=>{
        if(!req.user|| !req.user.role){
            return res.status(403).json({message:'Access denied. No user role found'});
        }
        
        if(!roles.includes(req.user.role)){
            return res.status(403).json({message:'Access denied.'})
        }
        next()
    }
}

module.exports=roleMiddleware