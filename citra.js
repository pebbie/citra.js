(function(){

this.CV = null;

(function(){
    CV = function(images, callback, canvas){
        CV.numimage = 0;
        for(i in images)CV.numimage++;
        CV.files = images;
        var canvas = $(canvas) || $(canvas) || document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        CV.context = ctx;
        CV.images = {};
        CV.numloaded = 0;
        for(i in images){
            $.load(images[i],i,function(e){
                var _i = e.target;
                canvas.width = _i.width;
                canvas.height = _i.height;
                ctx.drawImage(_i,0,0);
                CV.numloaded ++;
                CV.images[_i.id] = {};
                CV.images[_i.id] = ctx.getImageData(0,0,canvas.width,canvas.height);
                if(CV.numloaded == CV.numimage){
                    callback();
                }
            })
        }
    }
}());

CV.version = "1.0"

function $(id){return document.getElementById(id)}

$.load = function(url, id, callback)
{
    var img = new Image();
    img.id = id;
    img.onload = callback;
    img.src = url;
}

$.clamp = function(value,min,max){
    return Math.max(min,Math.min(max,value));
}

CV.transform = {
    grey:function(imd, dimd){
        for(y=0; y<imd.height; ++y){
            var p = y*imd.width*4;
            for(x=0; x<imd.width; ++x, p+=4){
                r = imd.data[p]
                g = imd.data[p+1]
                b = imd.data[p+2]
                gv = (.299 * r+ .587 * g+.114 * b)
                dimd.data[p] = gv;
                dimd.data[p+1] = gv;
                dimd.data[p+2] = gv;
            }
        }
    },
    scale:function(imd, newwidth, newheight){
        var nctx = document.createElement('canvas').getContext('2d')
        
        CV.display(imd);
        var cvs = nctx.canvas;
        cvs.width = newwidth;
        cvs.height = newheight;
        nctx.drawImage(CV.context.canvas,0,0,newwidth,newheight);
        return nctx.getImageData(0,0,newwidth,newheight);
    },
    rotate:function(imd,angle,cx,cy){
        var cx = cx || imd.width / 2;
        var cy = cy || imd.height / 2;
        
        var nctx = document.createElement('canvas').getContext('2d')
        
        CV.display(imd);
        var cvs = nctx.canvas;
        var sv = Math.sin(angle);
        var cv = Math.cos(angle);
        cvs.width = imd.width * cv + imd.height * sv;
        cvs.height = imd.width * sv + imd.height * cv;
        nctx.translate(cx*cv+cy*sv,cy*cv+cx*sv);
        nctx.rotate(angle);
        nctx.drawImage(CV.context.canvas,-imd.width/2,-imd.height/2,imd.width,imd.height);
        return nctx.getImageData(0,0,cvs.width,cvs.height);
    }
}

CV.clear = function(clearColor){
    CV.context.fillStyle = clearColor || "#fff";
    CV.context.fillRect(0,0,CV.context.canvas.width,CV.context.canvas.height);
}

CV.display = function(image,context){
    if(typeof(image)=="string") image = CV.images[image];
    context = context || CV.context;
    if(context.canvas.width != image.width || context.canvas.height != image.height){
        context.canvas.width = image.width;
        context.canvas.height = image.height;
    }
    context.putImageData(image,0,0);
}

CV.create = function(width,height){
    if(typeof(arguments[0])=="Number")
        return CV.context.createImageData(width,height);
    else
        return CV.context.createImageData(width.width,width.height);
};

CV.clone = function(oldimage){
    var c = CV.context;
    c.canvas.width = oldimage.width;
    c.canvas.height = oldimage.height;
    c.putImageData(oldimage,0,0);
    return c.getImageData(0,0,c.canvas.width,c.canvas.height);
};

CV.register = function(imdata, id){
    if(!CV.images[id])CV.images[id] = imdata;
}

CV.operator = {
    add:function(imd1,imd2,dimd){
        if(imd1.width==imd2.width && imd1.height==imd2.height){
            for(w = 0; w<imd1.data.length; ++w)
                dimd.data[w] = imd1.data[w]+imd2.data[w];
        }else{
            var stride1 = imd1.width*4;
            var stride2 = imd2.width*4;
            var dstride = dimd.width*4;
            var minw = Math.min(imd1.width, imd2.width, dimd.width);
            var minh = Math.min(imd1.height, imd2.height, dimd.height);
            for(var y=0; y<minh; ++y){
                for(var x=0; x<minw; ++x){
                    var dp = y*dstride+x*4;
                    var p1 = y*stride1+x*4;
                    var p2 = y*stride2+x*4;
                    dimd.data[dp] = imd1.data[p1]+imd2.data[p2];
                    dimd.data[dp+1] = imd1.data[p1+1]+imd2.data[p2+1];
                    dimd.data[dp+2] = imd1.data[p1+2]+imd2.data[p2+2];
                }
            }
        }
    },
    absDiff:function(imd1,imd2,dimd){
        if(imd1.width==imd2.width && imd1.height==imd2.height && imd1.width==dimd.width && imd1.height == dimd.height){
            for(w = 0; w<imd1.data.length; ++w){
                if(w%4!=3)
                    dimd.data[w] = Math.abs(imd1.data[w]-imd2.data[w]);
            }
        }else{
            var stride1 = imd1.width*4;
            var stride2 = imd2.width*4;
            var dstride = dimd.width*4;
            var minw = Math.min(imd1.width, imd2.width, dimd.width);
            var minh = Math.min(imd1.height, imd2.height, dimd.height);
            for(var y=0; y<minh; ++y){
                for(var x=0; x<minw; ++x){
                    var dp = y*dstride+x*4;
                    var p1 = y*stride1+x*4;
                    var p2 = y*stride2+x*4;
                    dimd.data[dp] = Math.abs(imd1.data[p1]-imd2.data[p2]);
                    dimd.data[dp+1] = Math.abs(imd1.data[p1+1]-imd2.data[p2+1]);
                    dimd.data[dp+2] = Math.abs(imd1.data[p1+2]-imd2.data[p2+2]);
                }
            }
        }
    }
}

CV.filter = {
    // image blur using integral image
    blur:function(imd, dimd, width){
        var width = width || 3;
        var integral = new Array();
        for(var i=0; i<imd.data.length; ++i)integral[i] = 0;
        for(var i=0; i<4; ++i)integral[i] = imd.data[i];
        
        /* top side */
        for(var x=1,p=4; x<imd.width; ++x, p+=4){
            integral[p] = imd.data[p]+integral[p-4];
            integral[p+1] = imd.data[p+1]+integral[p-3];
            integral[p+2] = imd.data[p+2]+integral[p-2];
            integral[p+3] = imd.data[p+3]+integral[p-1];
        }
        
        /* left side */
        var stride = imd.width*4;
        for(var y=1,p=stride; y<imd.height; ++y, p+=stride){
            integral[p] = imd.data[p]+integral[p-stride]
            integral[p+1] = imd.data[p+1]+integral[p-stride+1]
            integral[p+2] = imd.data[p+2]+integral[p-stride+2]
            integral[p+3] = imd.data[p+3]+integral[p-stride+3]
        }
        
        /* inner */
        for(var y=1; y<imd.height; ++y){
            p = y * stride + 4;
            for(var x=1; x<imd.width; ++x, p+=4){
                integral[p] = imd.data[p]+integral[p-4]+integral[p-stride]-integral[p-stride-4];
                integral[p+1] = imd.data[p+1]+integral[p-3]+integral[p-stride+1]-integral[p-stride-3];
                integral[p+2] = imd.data[p+2]+integral[p-2]+integral[p-stride+2]-integral[p-stride-2];
                integral[p+3] = imd.data[p+3]+integral[p-1]+integral[p-stride+3]-integral[p-stride-1];
            }
        }
        
        function getsum(top,left,right,bottom,offset)
        {
            offset = offset || 0;
            var bs = bottom*stride, ts = (top-1)*stride;
            var ls = (left-1)*4, rs = right*4;
            var br = bs+rs, tl = ts+ls;
            var bl = bs+ls, tr = ts+rs;
            
            sum = integral[br+offset];
            if(left>0) sum -= integral[bl+offset];
            if(top>0) sum -= integral[tr+offset];
            if(left>0 && top>0) sum += integral[tl+offset];
            
            return sum;
        }
        
        var midw = Math.floor(width/2);
        for(var y=0; y<imd.height; ++y){
            var p = y * stride;
            for(var x=0; x<imd.width; ++x, p+=4){
                
                var l = Math.max(0, x-midw);
                var r = Math.min(x+midw, imd.width);
                
                var t = Math.max(0, y-midw);
                var b = Math.min(y+midw, imd.height);
                
                var n = (r-l+1)*(b-t+1);
                
                dimd.data[p] = getsum(t,l,r,b,0)/n;
                dimd.data[p+1] = getsum(t,l,r,b,1)/n;
                dimd.data[p+2] = getsum(t,l,r,b,2)/n;
                dimd.data[p+3] = getsum(t,l,r,b,3)/n;
            }
        }
    },
    gaussianBlur:function(imd,dimd,sigma){
        function gauss(sgm){
            var norm = 1.0 / (sgm * Math.sqrt(2 * Math.PI));
            var ediv = 0.5 / (sgm * sgm);
            var ksize = 1 + 2 * Math.round(3 * sigma);
            ksize = (ksize<3)?3:ksize;
            if(ksize%2!=1) ksize += 1;
            var mid = ksize / 2;
            var sum = 0.0;
            var ker = new Array();
            for(var i=0; i<ksize; ++i){
                w = norm * Math.exp(-(i-mid)*(i-mid)*ediv);
                ker[i] = w;
                sum += w;
            }
            for(var i=0; i<ksize; ++i)ker[i] /= sum;
            return ker;
        }
        var kernel = gauss(sigma);
        var mid = Math.floor(kernel.length/2);
        
        var stride = imd.width*4;
        
        //horizontal convolution
        var p = 0;
        for(var y=0; y<imd.height; ++y, p+=stride){
            for(var x=0, px=0; x<imd.width; ++x, px+=4){
                var sumr = 0.0, sumg = 0.0, sumb = 0.0, suma = 0.0;
                var sumc = 0.0;
                for(dx=-mid; dx<=mid; ++dx){
                    if (x+dx<0 || x+dx>=imd.width) continue;
                    sumr += imd.data[p+px+dx*4]*kernel[dx+mid];
                    sumg += imd.data[p+px+dx*4+1]*kernel[dx+mid];
                    sumb += imd.data[p+px+dx*4+2]*kernel[dx+mid];
                    suma += imd.data[p+px+dx*4+3]*kernel[dx+mid];
                    sumc += kernel[dx+mid];
                }
                imd.data[p+px] = sumr / sumc;
                imd.data[p+px+1] = sumg / sumc;
                imd.data[p+px+2] = sumb / sumc;
                imd.data[p+px+3] = suma / sumc;
                
            }
        }
        
        //vertical convolution
        for(var x=0; x<imd.width; ++x){
            var px = x*4;
            for(var y=0, p=0; y<imd.height; ++y, p+=stride){
                var sumr = 0.0, sumg = 0.0, sumb = 0.0, suma = 0.0;
                var sumc = 0.0;
                var pd = p+px;
                for(dy=-mid; dy<=mid; ++dy){
                    if (y+dy<0 || y+dy>=imd.height) continue;
                    var py = dy * stride;
                    var pp = pd+py, ki = dy+mid;
                    sumr += imd.data[pp]*kernel[ki];
                    sumg += imd.data[pp+1]*kernel[ki];
                    sumb += imd.data[pp+2]*kernel[ki];
                    suma += imd.data[pp+3]*kernel[ki];
                    sumc += kernel[ki];
                }
                imd.data[pd] = sumr / sumc;
                imd.data[pd+1] = sumg / sumc;
                imd.data[pd+2] = sumb / sumc;
                imd.data[pd+3] = suma / sumc;
            }
        }
        
    },
    median:function(imd,dimd,width){
        var width = width || 3;
        var stride = imd.width*4;
        var mid = Math.floor(width/2);
        
        var p = 0;
        for(var y=0; y<imd.height; ++y){
            for(var x=0; x<imd.width; ++x, p+=4){
            
                var rb = new Array(), gb = new Array(), bb = new Array();
                for(dy=-mid; dy<=mid; ++dy){
                    if (y+dy<0 || y+dy>=imd.height) continue;
                    var oy = dy * stride;
                    for(dx=-mid; dx<=mid; ++dx){
                        if (x+dx<0 || x+dx>=imd.width) continue;
                        var ox = dx * 4;
                        
                        pp = p+oy+ox;
                        rb[rb.length] = imd.data[pp];
                        gb[gb.length] = imd.data[pp+1];
                        bb[bb.length] = imd.data[pp+2];
                    }
                }
                rb.sort();
                gb.sort();
                bb.sort();
                bmid = Math.floor(rb.length/2)+1;
                dimd.data[p] = rb[bmid];
                dimd.data[p+1] = gb[bmid];
                dimd.data[p+2] = bb[bmid];
            }
        }
    },
    treshold:function(imd, dimd, tvalue, range){
        tvalue = tvalue || 128;
        range = range || [0,255]
        for(y=0; y<imd.height; ++y){
            var p = y*imd.width*4;
            for(x=0; x<imd.width; ++x, p+=4){
                r = imd.data[p]
                g = imd.data[p+1]
                b = imd.data[p+2]
                gv = (.299 * r+ .587 * g+.114 * b)>tvalue?range[1]:range[0];
                dimd.data[p] = gv;
                dimd.data[p+1] = gv;
                dimd.data[p+2] = gv;
            }
        }
    }
};

(function(){

function Histogram(numbin){
    this.bins = new Array();
    this.ndata = 0;
    for(var i=0; i<numbin; ++i) bins[i] = 0;
}

Histogram.prototype = {
    addItem:function (bvalue){
        bins[bvalue] += 1;
        this.ndata ++;
    },
    toPdf:function(){
        var pdf = new Array();
        for(var i=0; i<this.bins.length; ++i)pdf[i] = this.bins[i] / ndata;
        return pdf;
    },
    toAccum:function(){
        var acc = new Array();
        for(var i=0,accum=0; i<this.bins.length; ++i){
            accum += this.bins[i]
            acc[i] = accum;
        }
        return acc;
    },
    toCdf:function(){
        var cdf = new Array();
        for(var i=0,accum=0; i<this.bins.length; ++i,accum+=this.bins[i])cdf[i] = (accum+this.bins[i])/ndata;
        return cdf;
    }
};

}());

}());

