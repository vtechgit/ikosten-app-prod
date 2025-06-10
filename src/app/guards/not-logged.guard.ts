import { CanActivateFn } from '@angular/router';

export const notLoggedGuard: CanActivateFn = (route, state) => {
  let session = localStorage.getItem('userSession') && localStorage.getItem('userSession') != '' ? JSON.parse(localStorage.getItem('userSession')) : undefined;

  if( session && session._id && session._id != ''){
    return true;
    //console.log('logged')


  }else{
    location.href='/auth/login';
    return false;

  }
  return true;
};
